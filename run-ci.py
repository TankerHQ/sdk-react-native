import argparse
import os
import platform
import shutil
import sys
from enum import Enum
from pathlib import Path
from typing import Optional

import cli_ui as ui  # noqa
import tankerci
import tankerci.android
import tankerci.git
import tankerci.gitlab
from tankerci.conan import Profile, TankerSource


class ReactNativeArchitecture(Enum):
    OLD = "old"
    NEW = "new"


def copy_local_aar(local_aar_path: Path) -> None:
    dest_path = Path.cwd() / "android/libs"
    shutil.rmtree(dest_path, ignore_errors=True)
    dest_path.mkdir()
    shutil.copy(local_aar_path, dest_path)


def get_detox_host_arch() -> str:
    m = platform.machine()
    if m == "arm64":
        return "armv8"
    elif m == "x86_64":
        return "x86_64"
    else:
        raise RuntimeError("Unsupported host platform for detox config")


def replace_line_in_file(f: Path, *, pattern: str, new_line: str) -> None:
    lines = f.read_text().splitlines()
    patched_lines = [new_line if pattern in line else line for line in lines]
    f.write_text("\n".join(patched_lines))


def lint() -> None:
    # CI lint
    tankerci.run("poetry", "run", "black", "--check", "--diff", ".")
    tankerci.run("poetry", "run", "flake8", ".")
    tankerci.run("poetry", "run", "isort", "--check", "--diff", "--profile=black", ".")
    tankerci.run("poetry", "run", "mypy", "--no-incremental", "run-ci.py")

    # RN lint
    tankerci.run("yarn", "install")
    tankerci.run("yarn", "run", "typecheck")
    tankerci.run("yarn", "run", "lint")


def run_detox_test(detox_config: str):
    example = Path.cwd() / "example"
    with tankerci.run_in_background(
        "yarn",
        "start",
        cwd=example,
        wait_for_process=5,
        # yarn start forks things, we need to killpg
        killpg=True,
    ), tankerci.run_in_background(
        "yarn",
        "adminserver",
        cwd=Path.cwd(),
        wait_for_process=5,
        killpg=True,
    ):
        tankerci.run(
            "yarn",
            "detox",
            "test",
            "--configuration",
            detox_config,
            cwd=example,
        )


def build_and_run_detox(
    os_name: str, os_version: str, rn_arch: ReactNativeArchitecture
) -> None:
    tankerci.run("yarn")

    if os_name == "android":
        android_api_level = (
            tankerci.android.ApiLevel.OLDEST
            if os_version == "oldest"
            else tankerci.android.ApiLevel.LATEST
        )

        if rn_arch == ReactNativeArchitecture.NEW:
            replace_line_in_file(
                Path.cwd() / "example/android/gradle.properties",
                pattern="newArchEnabled=",
                new_line="newArchEnabled=true",
            )

        # The Detox test harness sometimes disconnects in the middle,
        # but only in old Android versions in release
        # This is almost certainly not our code's fault,
        # and a considerable pain to track down, so we workaround it
        variant = (
            "debug"
            if android_api_level == tankerci.android.ApiLevel.OLDEST
            else "release"
        )

        detox_config = f"android.emu.{get_detox_host_arch()}.{os_version}.{variant}"

        local_aar_path = Path.cwd() / "artifacts/tanker-bindings.aar"
        if local_aar_path.exists():
            copy_local_aar(local_aar_path)
    elif os_name == "ios":
        if os_version != "latest":
            raise RuntimeError(f"Unsupported iOS os version {os_version} for detox")

        new_arch_enabled = "1" if rn_arch == ReactNativeArchitecture.NEW else "0"
        pod_install_env = {
            **os.environ.copy(),
            "RCT_NEW_ARCH_ENABLED": new_arch_enabled,
            "NO_FLIPPER": new_arch_enabled,
        }
        ios_app = Path.cwd() / "example" / "ios"
        tankerci.run("pod", "install", env=pod_install_env, cwd=ios_app)

        detox_config = "ios.sim.release"
    else:
        raise RuntimeError(f"Unsupported os {os_name} for detox")

    example = Path.cwd() / "example"
    tankerci.run("yarn", "detox", "build", "--configuration", detox_config, cwd=example)

    if os_name == "android":
        with tankerci.android.emulator(api_level=android_api_level, small_size=False):
            try:
                run_detox_test(detox_config)
            except:  # noqa
                dump_path = str(Path.cwd() / "logcat.txt")
                tankerci.android.dump_logcat(dump_path)
                tankerci.android.take_screenshot(Path.cwd() / "screenshot.png")
                ui.info("Tests have failed, logcat dumped to", dump_path)
                raise
    else:
        run_detox_test(detox_config)


def prepare(
    sdk: str,
    tanker_source: TankerSource,
    tanker_ref: Optional[str],
    home_isolation: bool,
    remote: str,
) -> None:
    sdk_folder = f"sdk-{sdk}"
    if "CI" in os.environ:
        repos = [sdk_folder]
        if tanker_source == TankerSource.SAME_AS_BRANCH:
            repos.append("sdk-native")
        workspace_path = tankerci.git.prepare_sources(repos=repos, clean=True)
    else:
        if tanker_source == TankerSource.SAME_AS_BRANCH:
            ui.fatal("--use-tanker=same-as-branch can only be used by the CI")
        workspace_path = Path.cwd().parent
    sdk_path = workspace_path / sdk_folder

    sdk_env = os.environ.copy()
    sdk_env.pop("VIRTUAL_ENV", None)
    tankerci.run(
        "poetry",
        "install",
        cwd=sdk_path,
        env=sdk_env,
    )
    args = [
        "poetry",
        "run",
        "python",
        "run-ci.py",
    ]
    if home_isolation:
        args.append("--isolate-conan-user-home")
        args.append(f"--remote={remote}")
    args.extend(["build-and-test", f"--use-tanker={tanker_source.value}"])
    if tanker_ref is not None:
        args.append(f"--tanker-ref={tanker_ref}")
    tankerci.run(*args, cwd=sdk_path, env=sdk_env)
    if sdk == "android":
        dest_path = Path.cwd() / "artifacts"
        shutil.rmtree(dest_path, ignore_errors=True)
        shutil.copytree(sdk_path / "artifacts", dest_path)
    elif sdk == "ios":
        dest_path = Path.cwd() / "pod"
        shutil.rmtree(dest_path, ignore_errors=True)
        shutil.copytree(sdk_path / "pod", dest_path)


def main() -> None:
    parser = argparse.ArgumentParser()

    subparsers = parser.add_subparsers(title="subcommands", dest="command")
    subparsers.add_parser("lint")

    detox_parser = subparsers.add_parser("detox")
    detox_parser.add_argument("os", choices=["android", "ios"])
    detox_parser.add_argument(
        "--os-version",
        choices=["oldest", "latest"],
        default="latest",
        dest="os_version",
    )
    detox_parser.add_argument(
        "--react-native-arch",
        type=ReactNativeArchitecture,
        choices=[
            ReactNativeArchitecture.OLD,
            ReactNativeArchitecture.NEW,
        ],
        default=ReactNativeArchitecture.OLD,
        dest="react_native_arch",
    )

    reset_branch_parser = subparsers.add_parser("reset-branch")
    reset_branch_parser.add_argument("branch", nargs="?")

    download_artifacts_parser = subparsers.add_parser("download-artifacts")
    download_artifacts_parser.add_argument("--project-id", required=True)
    download_artifacts_parser.add_argument("--pipeline-id", required=True)
    download_artifacts_parser.add_argument("--job-name", required=True)

    prepare_parser = subparsers.add_parser("prepare")
    prepare_parser.add_argument("sdk", choices=["android", "ios"])
    prepare_parser.add_argument(
        "--isolate-conan-user-home",
        action="store_true",
        dest="home_isolation",
        default=False,
    )
    prepare_parser.add_argument(
        "--use-tanker",
        type=tankerci.conan.TankerSource,
        choices=[
            TankerSource.EDITABLE,
            TankerSource.DEPLOYED,
            TankerSource.LOCAL,
            TankerSource.SAME_AS_BRANCH,
        ],
        default=TankerSource.EDITABLE,
        dest="tanker_source",
    )
    prepare_parser.add_argument("--build-profile", type=Profile)
    prepare_parser.add_argument("--remote", default="artifactory")
    prepare_parser.add_argument("--tanker-ref")

    args = parser.parse_args()
    command = args.command

    if command == "lint":
        lint()
    elif command == "detox":
        build_and_run_detox(args.os, args.os_version, args.react_native_arch)
    elif command == "reset-branch":
        fallback = os.environ["CI_COMMIT_REF_NAME"]
        ref = tankerci.git.find_ref(
            Path.cwd(), [f"origin/{args.branch}", f"origin/{fallback}"]
        )
        tankerci.git.reset(Path.cwd(), ref, clean=False)
    elif command == "download-artifacts":
        tankerci.gitlab.download_artifacts(
            project_id=args.project_id,
            pipeline_id=args.pipeline_id,
            job_name=args.job_name,
        )
    elif command == "prepare":
        prepare(
            args.sdk,
            args.tanker_source,
            args.tanker_ref,
            args.home_isolation,
            args.remote,
        )
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()

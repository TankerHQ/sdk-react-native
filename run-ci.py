import argparse
import os
import shutil
import sys
from pathlib import Path
from typing import Optional

import cli_ui as ui  # noqa
import tankerci
import tankerci.android
import tankerci.conan
import tankerci.git
import tankerci.gitlab
from tankerci.conan import Profile, TankerSource


def copy_local_aar(local_aar_path: Path) -> None:
    dest_path = Path.cwd() / "android/libs"
    shutil.rmtree(dest_path, ignore_errors=True)
    dest_path.mkdir()
    shutil.copy(local_aar_path, dest_path)


def build_and_test_android() -> None:
    example = Path.cwd() / "example"
    tankerci.run("yarn", "detox", "build", "--configuration", "android-ci", cwd=example)

    with tankerci.run_in_background(
        "yarn",
        "start",
        cwd=example,
        wait_for_process=5,
        # yarn start forks things, we need to killpg
        killpg=True,
    ), tankerci.run_in_background(
        "flask",
        "run",
        cwd=Path.cwd() / "adminserver",
        wait_for_process=5,
        killpg=False,
    ), tankerci.android.emulator(
        small_size=False
    ):
        try:
            tankerci.run(
                "yarn",
                "detox",
                "test",
                "--configuration",
                "android-ci",
                cwd=example,
            )
        except:  # noqa
            dump_path = str(Path.cwd() / "logcat.txt")
            tankerci.android.dump_logcat(dump_path)
            tankerci.android.take_screenshot(Path.cwd() / "screenshot.png")
            ui.info("Tests have failed, logcat dumped to", dump_path)
            raise


def build_and_test_ios() -> None:
    example = Path.cwd() / "example"
    tankerci.run("yarn", "detox", "build", "--configuration", "ios", cwd=example)

    with tankerci.run_in_background(
        "yarn",
        "start",
        cwd=example,
        wait_for_process=5,
        # yarn start forks things, we need to killpg
        killpg=False,
    ), tankerci.run_in_background(
        "flask",
        "run",
        cwd=Path.cwd() / "adminserver",
        wait_for_process=5,
        killpg=False,
    ):
        try:
            tankerci.run("yarn", "detox", "test", "--configuration", "ios", cwd=example)
        finally:
            if "CI" in os.environ:
                # this is needed to kill the React server launched by tests
                tankerci.run("killall", "node")


def prepare(
    sdk: str,
    tanker_source: TankerSource,
    tanker_ref: Optional[str],
    home_isolation: bool,
    build_profile: Profile,
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
    if sdk == "ios":
        dest_path = Path.cwd() / "pod"
        shutil.rmtree(dest_path, ignore_errors=True)
        shutil.copytree(sdk_path / "pod", dest_path)
    else:
        dest_path = Path.cwd() / "artifacts"
        shutil.rmtree(dest_path, ignore_errors=True)
        shutil.copytree(sdk_path / "artifacts", dest_path)


def build_and_test(sdk: str) -> None:
    if sdk == "ios":
        tankerci.run("pod", "repo", "update")
    tankerci.run("yarn")
    tankerci.run("yarn", "typescript")
    tankerci.run("yarn", "lint")
    if sdk == "android":
        local_aar_path = Path.cwd() / "artifacts/tanker-bindings.aar"
        if local_aar_path.exists():
            copy_local_aar(local_aar_path)
        build_and_test_android()
    else:
        build_and_test_ios()


def version_to_npm_tag(version: str) -> str:
    for tag in ["alpha", "beta"]:
        if tag in version:
            return tag

    return "latest"


def replace_line_in_file(f: Path, *, pattern: str, new_line: str) -> None:
    lines = f.read_text().splitlines()
    patched_lines = [new_line if pattern in line else line for line in lines]
    f.write_text("\n".join(patched_lines))


def patch_sdk_version(*, sdk: str, version: str) -> None:
    if sdk == "android":
        dest = Path.cwd() / "android/build.gradle"
        replace_line_in_file(
            dest,
            pattern="io.tanker:tanker-bindings:",
            new_line=f"    implementation 'io.tanker:tanker-bindings:{version}'",
        )
    else:
        dest = Path.cwd() / "ReactNativeTanker.podspec"
        replace_line_in_file(
            dest,
            pattern='''s.dependency "Tanker"''',
            new_line=f'''  s.dependency "Tanker", "{version}"''',
        )
    ui.info(f"Patched sdk-{sdk} version to {version} in {dest}")


def deploy(version: str) -> None:
    tankerci.bump_files(version)
    npm_tag = version_to_npm_tag(version)

    tankerci.run("yarn")
    tankerci.run("npm", "publish", "--access", "public", "--tag", npm_tag)


def main() -> None:
    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers(title="subcommands", dest="command")

    subparsers.add_parser("build-and-test")

    reset_branch_parser = subparsers.add_parser("reset-branch")
    reset_branch_parser.add_argument("branch", nargs="?")

    patch_sdk_version_parser = subparsers.add_parser("patch-sdk-version")
    patch_sdk_version_parser.add_argument("sdk", choices=["ios", "android"])
    patch_sdk_version_parser.add_argument("version", nargs="?")

    deploy_parser = subparsers.add_parser("deploy")
    deploy_parser.add_argument("--version")

    download_artifacts_parser = subparsers.add_parser("download-artifacts")
    download_artifacts_parser.add_argument("--project-id", required=True)
    download_artifacts_parser.add_argument("--pipeline-id", required=True)
    download_artifacts_parser.add_argument("--job-name", required=True)

    prepare_parser = subparsers.add_parser("prepare")
    prepare_parser.add_argument("sdk", choices=["ios", "android"])
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

    build_and_test_parser = subparsers.add_parser("build-and-test")
    build_and_test_parser.add_argument("sdk", choices=["ios", "android"])

    args = parser.parse_args()
    command = args.command

    if command == "reset-branch":
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
            tankerci.conan.get_build_profile(),
            args.remote,
        )
    elif command == "patch-sdk-version":
        if not args.version:
            ui.info(f"No version provided for sdk-{args.sdk}, nothing to patch")
        else:
            patch_sdk_version(sdk=args.sdk, version=args.version)
    elif command == "build-and-test":
        build_and_test(args.sdk)
    elif command == "deploy":
        deploy(args.version)
    else:
        parser.print_help()
        sys.exit()


if __name__ == "__main__":
    main()

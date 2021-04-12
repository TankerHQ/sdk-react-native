import cli_ui as ui  # noqa


from typing import Dict, List, Optional

import argparse
import os
from pathlib import Path
import shutil
import sys

import tankerci
import tankerci.android
import tankerci.conan
from tankerci.conan import TankerSource
import tankerci.git
import tankerci.gitlab
import cli_ui as ui


def copy_local_aar(local_aar_path: Path) -> None:
    dest_path = Path.cwd() / "android/libs"
    shutil.rmtree(dest_path, ignore_errors=True)
    dest_path.mkdir()
    shutil.copy(local_aar_path, dest_path)

def build_and_test_android() -> None:
    tankerci.run(
        "yarn", "detox", "build", "--configuration", "android-ci", cwd="example"
    )

    with tankerci.run_in_background(
        "yarn",
        "start",
        cwd="example",
        wait_for_process=5,
        # yarn start forks things, we need to killpg
        killpg=False,
    ), tankerci.run_in_background(
        "flask",
        "run",
        cwd="adminserver",
        wait_for_process=5,
        killpg=False,
    ), tankerci.android.emulator():
        tankerci.run(
            "yarn", "detox", "test", "--configuration", "android-ci", cwd="example"
        )


def build_and_test_ios() -> None:
    tankerci.run(
        "yarn", "detox", "build", "--configuration", "ios", cwd="example"
    )

    with tankerci.run_in_background(
        "yarn",
        "start",
        cwd="example",
        wait_for_process=5,
        # yarn start forks things, we need to killpg
        killpg=False,
    ), tankerci.run_in_background(
        "flask",
        "run",
        cwd="adminserver",
        wait_for_process=5,
        killpg=False,
    ):
        tankerci.run(
            "yarn", "detox", "test", "--configuration", "ios", cwd="example"
        )
    if "CI" in os.environ:
        # this is needed to kill the React server launched by tests
        tankerci.run("killall", "node")

def prepare(sdk: str, tanker_source: TankerSource, tanker_ref: Optional[str]) -> None:
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
        "build-and-test",
        f"--use-tanker={tanker_source.value}",
    ]
    if tanker_ref != None:
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


def main() -> None:
    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers(title="subcommands", dest="command")

    subparsers.add_parser("build-and-test")

    reset_branch_parser = subparsers.add_parser("reset-branch")
    reset_branch_parser.add_argument("branch")

    download_artifacts_parser = subparsers.add_parser("download-artifacts")
    download_artifacts_parser.add_argument("--project-id", required=True)
    download_artifacts_parser.add_argument("--pipeline-id", required=True)
    download_artifacts_parser.add_argument("--job-name", required=True)

    prepare_parser = subparsers.add_parser("prepare")
    prepare_parser.add_argument("sdk", choices=["ios"])
    prepare_parser.add_argument(
        "--use-tanker",
        type=tankerci.conan.TankerSource,
        choices=[
            TankerSource.EDITABLE,
            TankerSource.DEPLOYED,
            TankerSource.SAME_AS_BRANCH,
        ],
        default=TankerSource.EDITABLE,
        dest="tanker_source",
    )
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
        tankerci.git.reset(Path.cwd(), ref)
    elif command == "download-artifacts":
        tankerci.gitlab.download_artifacts(
            project_id=args.project_id,
            pipeline_id=args.pipeline_id,
            job_name=args.job_name,
        )
    elif command == "prepare":
        prepare(args.sdk, args.tanker_source, args.tanker_ref)
    elif command == "build-and-test":
        build_and_test(args.sdk)
    else:
        parser.print_help()
        sys.exit()


if __name__ == "__main__":
    main()

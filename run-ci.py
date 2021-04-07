import cli_ui as ui  # noqa


from typing import Dict, List, Optional

import argparse
import os
from pathlib import Path
import sys

import tankerci
import tankerci.android
import tankerci.git
import tankerci.gitlab
import cli_ui as ui


def build_and_check() -> None:
    tankerci.run("yarn", cwd="example")
    tankerci.run(
        "yarn", "detox", "build", "--configuration", "android-ci", cwd="example"
    )

    with tankerci.run_in_background(
        "yarn",
        "start",
        cwd="example",
        wait_for_process=5,
        # yarn start forks things, we need to killpg
        killpg=True,
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
    elif command == "build-and-test":
        build_and_check()
    else:
        parser.print_help()
        sys.exit()


if __name__ == "__main__":
    main()

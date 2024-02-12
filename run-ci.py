import argparse
import os
import platform
import shutil
import sys
from pathlib import Path

import cli_ui as ui  # noqa
import tankerci
import tankerci.android
import tankerci.git
import tankerci.gitlab


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


def run_detox(os: str) -> None:
    tankerci.run("yarn")
    if os == "android":
        detox_config = f"android.emu.{get_detox_host_arch()}.release"

        local_aar_path = Path.cwd() / "artifacts/tanker-bindings.aar"
        if local_aar_path.exists():
            copy_local_aar(local_aar_path)
    else:
        raise RuntimeError(f"Unsupported os {os} for detox")

    example = Path.cwd() / "example"
    tankerci.run("yarn", "detox", "build", "--configuration", detox_config, cwd=example)

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
    ), tankerci.android.emulator(
        small_size=False
    ):
        try:
            tankerci.run(
                "yarn",
                "detox",
                "test",
                "--configuration",
                detox_config,
                cwd=example,
            )
        except:  # noqa
            dump_path = str(Path.cwd() / "logcat.txt")
            tankerci.android.dump_logcat(dump_path)
            tankerci.android.take_screenshot(Path.cwd() / "screenshot.png")
            ui.info("Tests have failed, logcat dumped to", dump_path)
            raise


def main() -> None:
    parser = argparse.ArgumentParser()

    subparsers = parser.add_subparsers(title="subcommands", dest="command")
    subparsers.add_parser("lint")

    detox_parser = subparsers.add_parser("detox")
    detox_parser.add_argument("os", choices=["android"])

    reset_branch_parser = subparsers.add_parser("reset-branch")
    reset_branch_parser.add_argument("branch", nargs="?")

    download_artifacts_parser = subparsers.add_parser("download-artifacts")
    download_artifacts_parser.add_argument("--project-id", required=True)
    download_artifacts_parser.add_argument("--pipeline-id", required=True)
    download_artifacts_parser.add_argument("--job-name", required=True)

    args = parser.parse_args()
    command = args.command

    if command == "lint":
        lint()
    elif command == "detox":
        run_detox(args.os)
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
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()

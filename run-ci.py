import argparse
import sys

import cli_ui as ui  # noqa

import tankerci
import tankerci.android


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
    ), tankerci.android.emulator():
        tankerci.run(
            "yarn", "detox", "test", "--configuration", "android-ci", cwd="example"
        )


def main() -> None:
    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers(title="subcommands", dest="command")

    subparsers.add_parser("build-and-test")

    args = parser.parse_args()

    if args.command == "build-and-test":
        build_and_check()
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()

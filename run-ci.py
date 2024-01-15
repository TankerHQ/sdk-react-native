import argparse
import sys

import tankerci


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


def main() -> None:
    parser = argparse.ArgumentParser()

    subparsers = parser.add_subparsers(title="subcommands", dest="command")
    subparsers.add_parser("lint")

    args = parser.parse_args()
    command = args.command

    if command == "lint":
        lint()
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()

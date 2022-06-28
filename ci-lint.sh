#!/bin/sh

set -xe

poetry run black --check --diff .
poetry run flake8 .
poetry run isort --check --diff --profile black .
poetry run mypy

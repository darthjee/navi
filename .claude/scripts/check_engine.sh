#!/usr/bin/env bash
set -euo pipefail
set -x

docker compose run --rm navi_tests bash -c "yarn coverage && yarn lint && yarn report"

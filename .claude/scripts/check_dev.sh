#!/usr/bin/env bash
set -euo pipefail
set -x

docker compose run --rm navi_dev_app bash -c "yarn coverage && yarn lint && yarn report"
docker compose run --rm navi_dev_frontend bash -c "yarn coverage && yarn lint && yarn report"

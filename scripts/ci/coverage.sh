#!/bin/bash
set -e

DIR=${1:-.}

cd "$DIR"; bash <(curl -Ls https://coverage.codacy.com/get.sh) report --partial -r coverage/lcov.info

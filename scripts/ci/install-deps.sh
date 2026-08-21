#!/bin/bash
set -e

DIR=$1
FROZEN=${2:-false}

cd "$DIR"
if [ "$FROZEN" = "true" ]; then
  yarn install --frozen-lockfile
else
  yarn install
fi

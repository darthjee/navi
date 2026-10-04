#!/bin/bash
# Blocks until npm serves <pkg>@<version>.
#
# Usage: wait-for-npm.sh <pkg> <version>
#
# Env:
#   WAIT_FOR_NPM_INTERVAL  seconds between attempts (default 10)
#   WAIT_FOR_NPM_TIMEOUT   total seconds before giving up (default 300)
set -e

PACKAGE=$1
VERSION=$2

if [ -z "$PACKAGE" ] || [ -z "$VERSION" ]; then
  echo "Usage: $0 <pkg> <version>" >&2
  exit 1
fi

INTERVAL=${WAIT_FOR_NPM_INTERVAL:-10}
TIMEOUT=${WAIT_FOR_NPM_TIMEOUT:-300}
ELAPSED=0
ATTEMPT=1

while true; do
  FOUND=$(npm view "$PACKAGE@$VERSION" version --prefer-online 2>/dev/null || true)

  if [ "$FOUND" = "$VERSION" ]; then
    echo "$PACKAGE@$VERSION is available on npm"
    exit 0
  fi

  if [ "$ELAPSED" -ge "$TIMEOUT" ]; then
    echo "$PACKAGE@$VERSION published but not visible on npm after ${TIMEOUT}s" >&2
    exit 1
  fi

  echo "Attempt $ATTEMPT: $PACKAGE@$VERSION not visible on npm yet (${ELAPSED}s/${TIMEOUT}s) — retrying in ${INTERVAL}s"
  sleep "$INTERVAL"
  ELAPSED=$((ELAPSED + INTERVAL))
  ATTEMPT=$((ATTEMPT + 1))
done

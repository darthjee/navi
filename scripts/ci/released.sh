#!/bin/sh
# Tells whether a release (npm package or Docker image) happened earlier in
# this pipeline, by reading the workspace flag written by
# release-npm-package.sh or release-docker-image.sh.
#
# Usage: released.sh <name>
#   e.g. released.sh darthjee/navi-hey
#        released.sh deku-sprout
#
# Exit codes:
#   0  released/<name with / replaced by -> holds `true`
#   1  it holds `false` (nothing was released — nothing to do)
#   2  usage error, missing file (workspace not attached) or unexpected
#      content — this must fail the job, never silently skip it
#
# POSIX sh on purpose: the update-description jobs run on the Alpine
# darthjee/scripts image, which has no bash.
set -e

DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$DIR/../.." && pwd)"

NAME=$1

if [ -z "$NAME" ]; then
  echo "Usage: $0 <name>" >&2
  exit 2
fi

RELEASED_FILE="$REPO_ROOT/released/$(echo "$NAME" | tr '/' '-')"

if [ ! -f "$RELEASED_FILE" ]; then
  echo "$RELEASED_FILE not found — was the workspace attached?" >&2
  exit 2
fi

VALUE=$(tr -d '[:space:]' < "$RELEASED_FILE")

case "$VALUE" in
  true) exit 0 ;;
  false)
    echo "$NAME was not released — nothing to do"
    exit 1
    ;;
  *)
    echo "Unexpected value '$VALUE' in $RELEASED_FILE" >&2
    exit 2
    ;;
esac

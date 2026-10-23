#!/bin/sh
# Tells whether a Docker image was released earlier in this pipeline, by
# reading the workspace flag written by release-docker-image.sh.
#
# Usage: image-released.sh <image>
#
# Exit codes:
#   0  released/<image with / replaced by -> holds `true`
#   1  it holds `false` (the image was not released — nothing to do)
#   2  usage error, missing file (workspace not attached) or unexpected
#      content — this must fail the job, never silently skip it
#
# POSIX sh on purpose: the update-description jobs run on the Alpine
# darthjee/scripts image, which has no bash.
set -e

DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$DIR/../.." && pwd)"

IMAGE=$1

if [ -z "$IMAGE" ]; then
  echo "Usage: $0 <image>" >&2
  exit 2
fi

RELEASED_FILE="$REPO_ROOT/released/$(echo "$IMAGE" | tr '/' '-')"

if [ ! -f "$RELEASED_FILE" ]; then
  echo "$RELEASED_FILE not found — was the workspace attached?" >&2
  exit 2
fi

VALUE=$(tr -d '[:space:]' < "$RELEASED_FILE")

case "$VALUE" in
  true) exit 0 ;;
  false)
    echo "$IMAGE was not released — nothing to do"
    exit 1
    ;;
  *)
    echo "Unexpected value '$VALUE' in $RELEASED_FILE" >&2
    exit 2
    ;;
esac

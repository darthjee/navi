#!/bin/bash
# Releases one Docker image whenever its package.json version is not on
# Docker Hub yet, and records whether it released in the CircleCI workspace.
#
# Usage: release-docker-image.sh <image> <folder> <make target>
#   e.g. release-docker-image.sh darthjee/navi-hey source release
#        release-docker-image.sh darthjee/navi-hey-client clients/node release-client
#
# Flow:
#   1. read VERSION from <folder>/package.json;
#   2. check Docker Hub for <image>:<VERSION> (docker-hub-tag-exists.sh);
#   3. when missing, run `make <make target> TAG=<VERSION>` (pushes
#      :<VERSION> and :latest); when present, do nothing;
#   4. write `true`/`false` into released/<image with / replaced by ->, read
#      by the follower jobs through released.sh.
#
# Env:
#   DRY_RUN=1  print what would be released instead of running make (still
#              writes `true` when the tag is missing)
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$DIR/../.." && pwd)"

IMAGE=$1
FOLDER=$2
TARGET=$3

if [ -z "$IMAGE" ] || [ -z "$FOLDER" ] || [ -z "$TARGET" ]; then
  echo "Usage: $0 <image> <folder> <make target>" >&2
  exit 1
fi

VERSION=$(cd "$REPO_ROOT" && node -p "require('./$FOLDER/package.json').version")
RELEASED_DIR="$REPO_ROOT/released"
RELEASED_FILE="$RELEASED_DIR/$(echo "$IMAGE" | tr '/' '-')"

set +e
bash "$DIR/docker-hub-tag-exists.sh" "$IMAGE" "$VERSION"
STATUS=$?
set -e

case "$STATUS" in
  0)
    echo "$IMAGE:$VERSION already on Docker Hub — skipping"
    RELEASED=false
    ;;
  1)
    if [ "$DRY_RUN" = "1" ]; then
      echo "would release $IMAGE:$VERSION"
    else
      echo "Releasing $IMAGE:$VERSION"
      (cd "$REPO_ROOT" && make "$TARGET" TAG="$VERSION")
    fi
    RELEASED=true
    ;;
  *)
    echo "Could not check $IMAGE:$VERSION on Docker Hub" >&2
    exit 1
    ;;
esac

mkdir -p "$RELEASED_DIR"
echo "$RELEASED" > "$RELEASED_FILE"

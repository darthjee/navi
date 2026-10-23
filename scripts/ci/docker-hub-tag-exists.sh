#!/bin/bash
# Checks whether <image>:<tag> exists on Docker Hub, through the public Hub
# API (no login needed: the images are public).
#
# Usage: docker-hub-tag-exists.sh <image> <tag>
#
# Exit codes:
#   0  the tag exists (HTTP 200)
#   1  the tag is missing (HTTP 404)
#   2  usage error, curl failure or any other HTTP status — a transient
#      error must never be read as "missing", or an existing tag would be
#      pushed again
set -e

IMAGE=$1
TAG=$2

if [ -z "$IMAGE" ] || [ -z "$TAG" ]; then
  echo "Usage: $0 <image> <tag>" >&2
  exit 2
fi

URL="https://hub.docker.com/v2/repositories/$IMAGE/tags/$TAG"

set +e
STATUS=$(curl -s -o /dev/null -w '%{http_code}' "$URL")
CURL_STATUS=$?
set -e

if [ "$CURL_STATUS" != "0" ]; then
  echo "curl failed (exit $CURL_STATUS) checking $IMAGE:$TAG on Docker Hub" >&2
  exit 2
fi

case "$STATUS" in
  200) exit 0 ;;
  404) exit 1 ;;
  *)
    echo "Unexpected HTTP status $STATUS checking $IMAGE:$TAG on Docker Hub ($URL)" >&2
    exit 2
    ;;
esac

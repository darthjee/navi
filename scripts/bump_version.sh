#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <version>" >&2
  exit 1
fi

VERSION="$1"

if ! [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Error: version must be in format X.Y.Z" >&2
  exit 1
fi

MAJOR="${VERSION%%.*}"
REST="${VERSION#*.}"
MINOR="${REST%%.*}"
PATCH="${REST#*.}"

NEXT_VERSION="${MAJOR}.${MINOR}.$((PATCH + 1))"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

README="$ROOT_DIR/README.md"
PACKAGE_JSON="$ROOT_DIR/source/package.json"

sed -i '' \
  "s|\*\*Current Version:\*\* \[.*\](https://github.com/darthjee/navi/releases/tag/.*)|**Current Version:** [$VERSION](https://github.com/darthjee/navi/releases/tag/$VERSION)|" \
  "$README"

sed -i '' \
  "s|\*\*Next Release:\*\* \[.*\](https://github.com/darthjee/navi/compare/.*)|**Next Release:** [$NEXT_VERSION](https://github.com/darthjee/navi/compare/$VERSION...main)|" \
  "$README"

sed -i '' \
  "s|\"version\": \".*\"|\"version\": \"$VERSION\"|" \
  "$PACKAGE_JSON"

DEMO_DOCKERFILE="$ROOT_DIR/dockerfiles/demo_navi_hey/Dockerfile"

sed -i '' \
  "s|FROM darthjee/navi-hey:.*|FROM darthjee/navi-hey:$VERSION|" \
  "$DEMO_DOCKERFILE"

echo "Bumped to $VERSION (next release: $NEXT_VERSION)"

#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: $0 [app|client] [version]" >&2
  exit 1
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

README="$ROOT_DIR/README.md"
APP_PACKAGE_JSON="$ROOT_DIR/source/package.json"
CLIENT_PACKAGE_JSON="$ROOT_DIR/clients/node/package.json"
DEMO_DOCKERFILE="$ROOT_DIR/dockerfiles/demo_navi_hey/Dockerfile"

if [[ $# -gt 2 ]]; then
  usage
fi

TARGET="app"
VERSION=""

if [[ $# -eq 1 ]]; then
  if [[ "$1" =~ ^(app|client)$ ]]; then
    TARGET="$1"
  else
    VERSION="$1"
  fi
elif [[ $# -eq 2 ]]; then
  [[ "$1" =~ ^(app|client)$ ]] || usage
  TARGET="$1"
  VERSION="$2"
fi

package_json_for() {
  case "$1" in
    app) echo "$APP_PACKAGE_JSON" ;;
    client) echo "$CLIENT_PACKAGE_JSON" ;;
  esac
}

current_version() {
  local package_json
  package_json="$(package_json_for "$TARGET")"
  sed -n 's/.*"version": "\([0-9.]*\)".*/\1/p' "$package_json" | head -1
}

next_patch_version() {
  local base_version="$1"
  local major minor patch rest
  major="${base_version%%.*}"
  rest="${base_version#*.}"
  minor="${rest%%.*}"
  patch="${rest#*.}"
  echo "${major}.${minor}.$((patch + 1))"
}

if [[ -z "$VERSION" ]]; then
  VERSION="$(next_patch_version "$(current_version)")"
fi

if ! [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Error: version must be in format X.Y.Z" >&2
  exit 1
fi

MAJOR="${VERSION%%.*}"
REST="${VERSION#*.}"
MINOR="${REST%%.*}"
PATCH="${REST#*.}"

NEXT_VERSION="${MAJOR}.${MINOR}.$((PATCH + 1))"

bump_app() {
  sed -i '' \
    "s|\*\*Current Version:\*\* \[.*\](https://github.com/darthjee/navi/releases/tag/.*)|**Current Version:** [$VERSION](https://github.com/darthjee/navi/releases/tag/$VERSION)|" \
    "$README"

  sed -i '' \
    "s|\*\*Next Release:\*\* \[.*\](https://github.com/darthjee/navi/compare/.*)|**Next Release:** [$NEXT_VERSION](https://github.com/darthjee/navi/compare/$VERSION...main)|" \
    "$README"

  sed -i '' \
    "s|\"version\": \".*\"|\"version\": \"$VERSION\"|" \
    "$APP_PACKAGE_JSON"

  sed -i '' \
    "s|FROM darthjee/navi-hey:.*|FROM darthjee/navi-hey:$VERSION|" \
    "$DEMO_DOCKERFILE"
}

bump_client() {
  sed -i '' \
    "s|\"version\": \".*\"|\"version\": \"$VERSION\"|" \
    "$CLIENT_PACKAGE_JSON"

  if grep -q '\*\*Client Current Version:\*\*' "$README"; then
    sed -i '' \
      "s|\*\*Client Current Version:\*\* \[.*\](https://github.com/darthjee/navi/releases/tag/client-.*)|**Client Current Version:** [$VERSION](https://github.com/darthjee/navi/releases/tag/client-$VERSION)|" \
      "$README"
  else
    sed -i '' \
      "/\*\*Next Release:\*\*/a\\
\\
**Client Current Version:** [$VERSION](https://github.com/darthjee/navi/releases/tag/client-$VERSION)" \
      "$README"
  fi

  if grep -q '\*\*Client Next Version:\*\*' "$README"; then
    sed -i '' \
      "s|\*\*Client Next Version:\*\* \[.*\](https://github.com/darthjee/navi/compare/client-.*)|**Client Next Version:** [$NEXT_VERSION](https://github.com/darthjee/navi/compare/client-$VERSION...main)|" \
      "$README"
  else
    sed -i '' \
      "/\*\*Client Current Version:\*\*/a\\
\\
**Client Next Version:** [$NEXT_VERSION](https://github.com/darthjee/navi/compare/client-$VERSION...main)" \
      "$README"
  fi
}

case "$TARGET" in
  app) bump_app ;;
  client) bump_client ;;
esac

echo "Bumped $TARGET to $VERSION (next release: $NEXT_VERSION)"

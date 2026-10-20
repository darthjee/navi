#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: $0 [--force] [app|all|client|worker|deku-sprout] [version]" >&2
  exit 1
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# shellcheck source=lib/package_bump_check.sh
source "$SCRIPT_DIR/lib/package_bump_check.sh"

README="$ROOT_DIR/README.md"
APP_README="$ROOT_DIR/source/README.md"
CLIENT_README="$ROOT_DIR/clients/node/README.md"
WORKER_README="$ROOT_DIR/worker/README.md"
LOGGER_README="$ROOT_DIR/logger/README.md"
APP_PACKAGE_JSON="$ROOT_DIR/source/package.json"
CLIENT_PACKAGE_JSON="$ROOT_DIR/clients/node/package.json"
WORKER_PACKAGE_JSON="$ROOT_DIR/worker/package.json"
LOGGER_PACKAGE_JSON="$ROOT_DIR/logger/package.json"
DEMO_DOCKERFILE="$ROOT_DIR/dockerfiles/demo_navi_hey/Dockerfile"

# The bump check uses repo-relative paths.
cd "$ROOT_DIR"

TARGETS_REGEX='^(app|all|client|worker|deku-sprout)$'

FORCE="false"
POSITIONAL=()
for arg in "$@"; do
  if [[ "$arg" == "--force" ]]; then
    FORCE="true"
  else
    POSITIONAL+=("$arg")
  fi
done

if [[ ${#POSITIONAL[@]} -gt 2 ]]; then
  usage
fi

TARGET="app"
REQUESTED_VERSION=""

if [[ ${#POSITIONAL[@]} -eq 1 ]]; then
  if [[ "${POSITIONAL[0]}" =~ $TARGETS_REGEX ]]; then
    TARGET="${POSITIONAL[0]}"
  else
    REQUESTED_VERSION="${POSITIONAL[0]}"
  fi
elif [[ ${#POSITIONAL[@]} -eq 2 ]]; then
  [[ "${POSITIONAL[0]}" =~ $TARGETS_REGEX ]] || usage
  TARGET="${POSITIONAL[0]}"
  REQUESTED_VERSION="${POSITIONAL[1]}"
fi

package_json_for() {
  case "$1" in
    app) echo "$APP_PACKAGE_JSON" ;;
    client) echo "$CLIENT_PACKAGE_JSON" ;;
    worker) echo "$WORKER_PACKAGE_JSON" ;;
    deku-sprout) echo "$LOGGER_PACKAGE_JSON" ;;
  esac
}

current_version() {
  local package_json
  package_json="$(package_json_for "$1")"
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

validate_version() {
  if ! [[ "$1" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "Error: version must be in format X.Y.Z" >&2
    exit 1
  fi
}

# Packages released alongside the app: "<target> <folder> <tag-prefix>".
CHECKED_PACKAGES=(
  "worker worker worker-"
  "deku-sprout logger deku-sprout-"
)

STALE_TARGETS=()
STALE_MESSAGES=()

# Collects the packages whose published files (lib/, package.json) changed
# since their last release tag while their working-tree version did not.
# Compares the tag against the working tree, so an uncommitted bump counts.
find_stale_packages() {
  local entry target folder prefix
  STALE_TARGETS=()
  STALE_MESSAGES=()

  for entry in "${CHECKED_PACKAGES[@]}"; do
    read -r target folder prefix <<< "$entry"

    if ! package_bump_check "$folder" "$prefix" HEAD > /dev/null 2>&1; then
      STALE_TARGETS+=("$target")
      STALE_MESSAGES+=("$target ($folder/) changed since $PACKAGE_BUMP_LAST_TAG but version $PACKAGE_BUMP_VERSION was not bumped")
    fi
  done
}

# Rewrites the README Versions table row "| <label> | ... |".
update_readme_row() {
  local label="$1"
  local tag="$2$VERSION"

  if ! grep -qF "| $label |" "$README"; then
    echo "Error: README Versions table has no \"$label\" row" >&2
    exit 1
  fi

  sed -i '' \
    "s#^| $label | .* |\$#| $label | [$VERSION](https://github.com/darthjee/navi/releases/tag/$tag) | [$NEXT_VERSION](https://github.com/darthjee/navi/compare/$tag...main) |#" \
    "$README"
}

# Rewrites the GitHub Release badge link to point at the new release tag.
update_release_badge() {
  local readme="$1"

  sed -i '' \
    "s#(https://github.com/darthjee/navi/releases/tag/[0-9.]*)\$#(https://github.com/darthjee/navi/releases/tag/$VERSION)#" \
    "$readme"
}

# Rewrites a README badge "badge/<label>-v<version>-" for a package.
update_package_badge() {
  local label="$1"
  local readme="$2"

  if ! grep -qF "badge/$label-v" "$readme"; then
    echo "Error: $readme has no \"$label\" badge" >&2
    exit 1
  fi

  sed -i '' \
    "s#badge/$label-v[0-9.]*-#badge/$label-v$VERSION-#" \
    "$readme"
}

bump_app() {
  update_readme_row "Navi-Hey" ""
  update_release_badge "$README"
  update_release_badge "$APP_README"

  sed -i '' \
    "s|\"version\": \".*\"|\"version\": \"$VERSION\"|" \
    "$APP_PACKAGE_JSON"

  sed -i '' \
    "s|FROM darthjee/navi-hey:.*|FROM darthjee/navi-hey:$VERSION|" \
    "$DEMO_DOCKERFILE"
}

bump_client() {
  update_readme_row "Client" "client-"
  update_package_badge "navi_hey_client" "$CLIENT_README"

  sed -i '' \
    "s|\"version\": \".*\"|\"version\": \"$VERSION\"|" \
    "$CLIENT_PACKAGE_JSON"
}

bump_worker() {
  update_readme_row "Worker (Deku Swarm)" "worker-"
  update_package_badge "deku_swarm" "$APP_README"
  update_package_badge "deku_swarm" "$WORKER_README"

  sed -i '' \
    "s|\"version\": \".*\"|\"version\": \"$VERSION\"|" \
    "$WORKER_PACKAGE_JSON"
}

bump_deku_sprout() {
  update_readme_row "Lib (Deku Sprout)" "deku-sprout-"
  update_package_badge "deku_sprout" "$APP_README"
  update_package_badge "deku_sprout" "$CLIENT_README"
  update_package_badge "deku_sprout" "$WORKER_README"
  update_package_badge "deku_sprout" "$LOGGER_README"

  sed -i '' \
    "s|\"version\": \".*\"|\"version\": \"$VERSION\"|" \
    "$LOGGER_PACKAGE_JSON"
}

# Bumps <target> to <version> (or to the next patch of its current version).
bump_target() {
  local target="$1"
  VERSION="${2:-}"

  if [[ -z "$VERSION" ]]; then
    VERSION="$(next_patch_version "$(current_version "$target")")"
  fi

  validate_version "$VERSION"

  local major minor patch rest
  major="${VERSION%%.*}"
  rest="${VERSION#*.}"
  minor="${rest%%.*}"
  patch="${rest#*.}"
  NEXT_VERSION="${major}.${minor}.$((patch + 1))"

  case "$target" in
    app) bump_app ;;
    client) bump_client ;;
    worker) bump_worker ;;
    deku-sprout) bump_deku_sprout ;;
  esac

  echo "Bumped $target to $VERSION (next release: $NEXT_VERSION)"
}

report_stale() {
  local prefix="$1" message
  for message in "${STALE_MESSAGES[@]}"; do
    echo "$prefix$message" >&2
  done
}

case "$TARGET" in
  app)
    if [[ -n "$REQUESTED_VERSION" ]]; then
      validate_version "$REQUESTED_VERSION"
    fi

    find_stale_packages

    if [[ ${#STALE_TARGETS[@]} -gt 0 ]]; then
      if [[ "$FORCE" != "true" ]]; then
        report_stale "Error: "
        echo "Bump them with \`$0 <target>\`, use \`$0 all\`, or pass --force." >&2
        echo "Run \`git fetch --tags\` if release tags may be missing locally." >&2
        exit 1
      fi

      report_stale "Warning: "
      echo "Warning: --force given, bumping the app anyway." >&2
    fi

    bump_target app "$REQUESTED_VERSION"
    ;;
  all)
    if [[ -n "$REQUESTED_VERSION" ]]; then
      validate_version "$REQUESTED_VERSION"
    fi

    find_stale_packages

    bump_target app "$REQUESTED_VERSION"

    for stale_target in ${STALE_TARGETS[@]+"${STALE_TARGETS[@]}"}; do
      bump_target "$stale_target"
    done
    ;;
  *)
    bump_target "$TARGET" "$REQUESTED_VERSION"
    ;;
esac

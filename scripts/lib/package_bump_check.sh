#!/usr/bin/env bash
# Shared "published files changed but version not bumped" detection for the
# local packages released alongside the app (worker/ -> deku-swarm,
# logger/ -> deku-sprout).
#
# Meant to be SOURCED, not executed. Used by:
#   - scripts/ci/check-and-publish-package.sh (CI: base ref HEAD^, compares
#     against HEAD)
#   - scripts/bump_version.sh (local: base ref HEAD, compares against the
#     working tree, so an uncommitted bump counts as bumped)
#
# Functions:
#   package_bump_read_version
#       Reads a package.json from stdin and prints its "version".
#   package_bump_last_tag <tag_prefix> <base_ref>
#       Prints the last release tag (<tag_prefix>X.Y.Z, falling back to the
#       app X.Y.Z tag) reachable from <base_ref>, or an empty string.
#   package_bump_check <folder> <tag_prefix> <base_ref> [<compare_ref>]
#       Returns 0 when there is no previous tag, nothing changed under
#       <folder>/lib or <folder>/package.json, or the version was bumped.
#       Returns 1 when the published files changed but the version did not
#       (the message goes to stderr). Sets PACKAGE_BUMP_LAST_TAG,
#       PACKAGE_BUMP_VERSION and PACKAGE_BUMP_LAST_VERSION for callers.

package_bump_read_version() {
  node -p "JSON.parse(require('fs').readFileSync(0, 'utf8')).version"
}

package_bump_last_tag() {
  local tag_prefix="$1"
  local base_ref="$2"

  git describe --tags --abbrev=0 --match="${tag_prefix}*" --match='[0-9]*.[0-9]*.[0-9]*' "$base_ref" 2>/dev/null || echo ""
}

package_bump_check() {
  local folder="$1"
  local tag_prefix="$2"
  local base_ref="$3"
  local compare_ref="${4:-}"

  PACKAGE_BUMP_LAST_TAG=""
  PACKAGE_BUMP_VERSION=""
  PACKAGE_BUMP_LAST_VERSION=""

  PACKAGE_BUMP_VERSION=$(package_bump_read_version < "$folder/package.json")
  PACKAGE_BUMP_LAST_TAG=$(package_bump_last_tag "$tag_prefix" "$base_ref")

  if [ -z "$PACKAGE_BUMP_LAST_TAG" ]; then
    echo "No previous release tag found — skipping bump check"
    return 0
  fi

  local range="$PACKAGE_BUMP_LAST_TAG"
  if [ -n "$compare_ref" ]; then
    range="$PACKAGE_BUMP_LAST_TAG..$compare_ref"
  fi

  if git diff --quiet "$range" -- "$folder/lib" "$folder/package.json"; then
    echo "No published files changed in $folder/ since $PACKAGE_BUMP_LAST_TAG"
    return 0
  fi

  PACKAGE_BUMP_LAST_VERSION=$(git show "$PACKAGE_BUMP_LAST_TAG:$folder/package.json" 2>/dev/null | package_bump_read_version 2>/dev/null || echo "")

  if [ "$PACKAGE_BUMP_LAST_VERSION" = "$PACKAGE_BUMP_VERSION" ]; then
    echo "$folder/ published files changed since $PACKAGE_BUMP_LAST_TAG but version $PACKAGE_BUMP_VERSION was not bumped" >&2
    return 1
  fi

  echo "$folder/ changed since $PACKAGE_BUMP_LAST_TAG and version was bumped (${PACKAGE_BUMP_LAST_VERSION:-none} -> $PACKAGE_BUMP_VERSION)"
  return 0
}

#!/bin/bash
# release.yml lookup, sourced by the release scripts
# (scripts/ci/release-npm-package.sh, scripts/ci/push-release-tag.sh,
# scripts/bump_version.sh).
#
# Requires scripts/release's dependencies to be installed
# (scripts/ci/install-deps.sh scripts/release).

# Sets INFO_FOLDER, INFO_PLATFORM, INFO_TAG_PREFIX and INFO_DEPENDS_ON for
# the given release.yml package, parsing the KEY=value lines of
# scripts/release/bin/release-package-info.js (no eval).
#
# Usage: read_package_info <release.yml package name> <repo root>
# shellcheck disable=SC2034 # INFO_* are read by the sourcing scripts.
read_package_info() {
  local name="$1"
  local repo_root="$2"
  local output line key value

  output=$(node "$repo_root/scripts/release/bin/release-package-info.js" "$name" "$repo_root")

  INFO_FOLDER=""
  INFO_PLATFORM=""
  INFO_TAG_PREFIX=""
  INFO_DEPENDS_ON=""

  while IFS= read -r line; do
    key="${line%%=*}"
    value="${line#*=}"

    case "$key" in
      FOLDER) INFO_FOLDER="$value" ;;
      PLATFORM) INFO_PLATFORM="$value" ;;
      TAG_PREFIX) INFO_TAG_PREFIX="$value" ;;
      DEPENDS_ON) INFO_DEPENDS_ON="$value" ;;
    esac
  done <<< "$output"
}

#!/bin/bash
# Releases one npm package of release.yml (deku-sprout, deku-swarm, navi-hey,
# navi-hey-client) whenever its package.json version is not on npm yet.
#
# Usage: release-npm-package.sh <release.yml package name>
#
# Flow:
#   1. resolve the package's folder, platform, tag prefix and dependencies
#      from release.yml (scripts/release/bin/release-package-info.js);
#   2. forgotten-bump check (scripts/lib/package_bump_check.sh);
#   3. wait until every dependency's current version is visible on npm;
#   4. publish when the version is not on npm yet, no-op otherwise;
#   5. after an actual publish, wait until the version is visible on npm;
#   6. write `true`/`false` into released/<package with / replaced by ->,
#      read by the follower jobs (e.g. the push-tag-<package> jobs) through
#      released.sh.
#
# No git tag is pushed here: the separate push-tag-<package> jobs push the
# `<tag_prefix><version>` tags (scripts/ci/push-release-tag.sh).
#
# Env:
#   SKIP_BUMP_CHECK=true  skip the forgotten-version-bump check
#   DRY_RUN=1             print what would be waited for/published instead of
#                         doing it (still writes `true` when the version is
#                         missing on npm)
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$DIR/../.." && pwd)"

PACKAGE=$1

if [ -z "$PACKAGE" ]; then
  echo "Usage: $0 <release.yml package name>" >&2
  exit 1
fi

# shellcheck source=../lib/package_bump_check.sh
source "$DIR/../lib/package_bump_check.sh"

# shellcheck source=../lib/release_package_info.sh
source "$DIR/../lib/release_package_info.sh"

resolve() {
  bash "$DIR/install-deps.sh" "$REPO_ROOT/scripts/release" true

  read_package_info "$PACKAGE" "$REPO_ROOT"

  FOLDER="$INFO_FOLDER"
  TAG_PREFIX="$INFO_TAG_PREFIX"
  DEPENDS_ON="$INFO_DEPENDS_ON"

  if [ "$INFO_PLATFORM" != "npm" ]; then
    echo "$PACKAGE is not an npm package (platform: ${INFO_PLATFORM:-none})" >&2
    exit 1
  fi

  VERSION=$(package_bump_read_version < "$REPO_ROOT/$FOLDER/package.json")
}

# --- forgotten-bump check (git-only, shared with scripts/bump_version.sh) ---
check_version_bump() {
  if [ "$SKIP_BUMP_CHECK" = "true" ]; then
    echo "SKIP_BUMP_CHECK=true — skipping bump check"
    return 0
  fi

  # Start from HEAD^ so the tag currently being built is never returned.
  if ! (cd "$REPO_ROOT" && package_bump_check "$FOLDER" "$TAG_PREFIX" HEAD^ HEAD); then
    exit 1
  fi
}

# --- wait for the dependencies on npm ---
wait_for_dependencies() {
  local dep dep_version

  for dep in $DEPENDS_ON; do
    read_package_info "$dep" "$REPO_ROOT"
    dep_version=$(package_bump_read_version < "$REPO_ROOT/$INFO_FOLDER/package.json")

    if [ "$DRY_RUN" = "1" ]; then
      echo "would wait for $dep@$dep_version"
    else
      bash "$DIR/wait-for-npm.sh" "$dep" "$dep_version"
    fi
  done
}

# --- publish decision (npm) ---
needs_publish() {
  local output status
  set +e
  output=$(npm view "$PACKAGE@$VERSION" version 2>&1)
  status=$?
  set -e

  if [ "$status" = "0" ] && [ "$output" = "$VERSION" ]; then
    echo "$PACKAGE@$VERSION already on npm — skipping publish"
    return 1
  fi

  if [ "$status" = "0" ] && [ -z "$output" ]; then
    # npm prints nothing (and exits 0) for a version missing from an existing package.
    return 0
  fi

  if echo "$output" | grep -qE 'E404|404 Not Found|is not in this registry|is not in the npm registry'; then
    return 0
  fi

  echo "npm view $PACKAGE@$VERSION failed:" >&2
  echo "$output" >&2
  exit 1
}

publish() {
  if [ "$DRY_RUN" = "1" ]; then
    echo "would publish $PACKAGE@$VERSION"
    return 0
  fi

  echo "Publishing $PACKAGE@$VERSION to npm"

  # Skip when the job already installed the folder (navi-hey installs source/
  # before pin-local-deps, after which a frozen install would fail).
  if [ ! -d "$REPO_ROOT/$FOLDER/node_modules" ]; then
    bash "$DIR/../ci.sh" install-deps "$REPO_ROOT/$FOLDER" true
  fi
  bash "$DIR/../ci.sh" publish "$REPO_ROOT/$FOLDER"
}

# --- wait for the published version on npm ---
wait_for_self() {
  if [ "$DRY_RUN" = "1" ]; then
    return 0
  fi

  bash "$DIR/wait-for-npm.sh" "$PACKAGE" "$VERSION"
}

# --- released flag (CircleCI workspace) ---
write_released() {
  local released_dir="$REPO_ROOT/released"

  mkdir -p "$released_dir"
  echo "$1" > "$released_dir/$(echo "$PACKAGE" | tr '/' '-')"
}

resolve
check_version_bump
wait_for_dependencies

if needs_publish; then
  publish
  wait_for_self
  write_released true
else
  write_released false
fi

# Issue: bump_version.sh should flag packages changed since their last release but not bumped

## Description
Once #964 lands, the only way `deku-sprout` (`logger/`) and `deku-swarm` (`worker/`) get published is the app `X.Y.Z` release. If someone bumps the app and forgets a package whose published files changed, the release fails late, in CI: the bump check in `check-and-publish-package.sh` stops the pipeline after the app tag is already pushed. Today this only works because the maintainer always remembers to bump those packages by hand.

## Problem
`scripts/bump_version.sh [app|client|worker|deku-sprout] [version]` bumps one target at a time and doesn't look at the other packages. Before tagging, nothing warns you that `logger/lib` or `worker/lib` (or their `package.json`) changed since the last release tag while the version stayed the same.

## Expected Behavior
- `bump_version.sh app [version]` checks `worker/` and `logger/` before changing any file. For each package it finds the last release tag (`worker-X.Y.Z` / `deku-sprout-X.Y.Z`, falling back to the latest app `X.Y.Z` tag), using the same rules as the CI check.
- A package is **stale** when its published files (`lib/`, `package.json`) differ between that tag and the **working tree**, and its working-tree version equals the version at that tag. Comparing against the working tree means a package bump that isn't committed yet (e.g. `bump_version.sh worker` run just before) counts as bumped.
- If any package is stale, the script refuses: it prints which package(s) are stale and against which tag, changes no file, and exits non-zero.
- `--force` skips the refusal and bumps the app anyway.
- New `all` target: `bump_version.sh all [version]` bumps the app (to `[version]`, or the next patch) and patch-bumps every stale package in the same run, then reports what it bumped. Packages that are unchanged or already bumped are left alone.
- `client`, `worker` and `deku-sprout` targets behave as they do today (no cross-package check). `client` is a separate `client-X.Y.Z` track and is never checked.
- When no previous release tag exists for a package, it is skipped, as in CI.

## Solution
- Move the forgotten-bump detection out of `check_version_bump` in `scripts/ci/check-and-publish-package.sh` into a shared helper (e.g. `scripts/lib/package_bump_check.sh`). Both `bump_version.sh` and `check-and-publish-package.sh` use it, so the local and CI checks can't drift apart.
- The helper takes the folder, the tag prefix and the base ref used for tag lookup as parameters:
  - CI keeps `HEAD^` (so the tag being built is never returned) and compares against `HEAD`. CI behavior and output stay the same, including `SKIP_BUMP_CHECK`.
  - Locally, the base ref is `HEAD` (no tag exists yet) and the comparison is against the working tree.
- In `bump_version.sh`, add `--force` parsing and the `all` target, and update the usage line. Keep the existing `sed -i ''` (macOS) editing style.
- Out of scope: auto-fetching tags (`git fetch --tags`) and a check-only mode.

## Benefits
- Catches a forgotten package bump locally, before tagging, instead of as a failed release in CI.
- Makes the single-trigger release flow from #964 safe without relying on memory.
- One source of truth for "changed but not bumped", shared by local and CI.
- `bump_version.sh all` turns a multi-package release into one command.

# Issue: Cascade-bump test in CI

## Description

Part of Epic #977 (release-cycle overhaul). Add a CI test that fails when a package's version was bumped but the packages depending on it were not.

Depends on #983 (merged): the root `release.yml` and the `scripts/release/` package (`navi-release-scripts`) with `loadReleaseTree`.

## Problem

When `deku-sprout` or `deku-swarm` change version, the packages consuming them must be released again too, or the published `navi-hey` / `navi-hey-client` keep using the old version. Today nothing enforces this cascade.

## Expected Behavior

- For every npm entry of `release.yml` whose `package.json` `version` differs between the base ref and `HEAD`, every package depending on it, directly or transitively through `depends_on`, must also have a different `version`.
- On failure the test exits non-zero and names each missing bump and the bumped dependency that requires it (e.g. `navi-hey-client must be bumped because deku-sprout changed 0.3.0 -> 0.4.0`).
- Examples:
  - a `deku-sprout` bump requires bumps of `navi-hey` and `navi-hey-client` (and so their images);
  - a `deku-swarm` bump requires a `navi-hey` bump;
  - a `navi-hey-client` bump requires nothing more.
- Docker entries need no own check: their version is the `version` of the `package.json` in their folder, so they follow their npm package.
- A package with no `package.json` at the base ref counts as not bumped (it cannot trigger a cascade).
- Comparison base per CI context:
  - **PR branches**: `git merge-base HEAD origin/main`;
  - **`X.Y.Z` tags**: the previous `X.Y.Z` tag reachable from `HEAD^`;
  - **`main`**: `HEAD^` (the merged commit's parent).
  - When no base can be found (e.g. no previous `X.Y.Z` tag), the test passes with a message.
- A CI job runs it on branches and on `X.Y.Z` tags (the existing `*all-tags` filter until #985 restricts triggers).

### Out of scope

- Checking that a dependent's declared range (e.g. `navi-hey-client`'s `^0.3.0` for `deku-sprout`) accepts the new version: version bump only.
- The forgotten-bump check (files changed without a bump), which stays in `scripts/lib/package_bump_check.sh`.

## Solution

- Implement it in the `scripts/release/` Node package, next to the #983 validator:
  - a pure lib module, e.g. `checkCascadeBumps(tree, baseVersions, headVersions)`, returning error strings and walking dependents transitively;
  - a small git helper reading `<folder>/package.json` at a ref (`git show <ref>:<folder>/package.json`) and resolving the base ref for the current context;
  - a thin CLI, e.g. `bin/check-cascade-bumps.js`, taking the repo root and an optional base ref.
- Jasmine specs for the lib module (fixtures for each example above) and the base-ref resolution.
- Wire it as `scripts/ci.sh cascade-bump-check` calling a new `scripts/ci/cascade-bump-check.sh`, and add a `cascade-bump-check` CI job in `.circleci/config.yml`. Make sure `origin/main` and tags are available in the checkout.
- The CI context comes from CircleCI's `CIRCLE_TAG` / `CIRCLE_BRANCH`.
- Reuse the tag-matching pattern from `scripts/lib/package_bump_check.sh` (`--match='[0-9]*.[0-9]*.[0-9]*'`) for the last `X.Y.Z` tag.
- Update `scripts/release/README.md` and `docs/agents/specs/release/detection.md#cascade-bump-test` with the settled refs.
- Ownership: architect (`scripts/`, `.circleci/config.yml`).

## Benefits

- A dependency release can no longer ship without the packages consuming it.
- The release scripts and this test share `release.yml` instead of hardcoding the tree.

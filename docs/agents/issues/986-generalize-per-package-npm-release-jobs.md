# Issue: Generalize per-package npm release jobs

## Description

Part of Epic #977 (release-cycle overhaul). Replace the per-package publish jobs with one always-run release job per npm package. Each job publishes only when its version is not on npm yet.

## Problem

- Only `deku-swarm` and `deku-sprout` get a "publish if not yet on npm" check (`scripts/ci/check-and-publish-package.sh`, through `check-and-publish-worker` / `check-and-publish-deku-sprout`).
- `navi-hey` publishes unconditionally on `X.Y.Z` (`npm-publish`).
- `navi-hey-client` has no release job at all since #985 removed the `client-` pipeline.

## Expected Behavior

- On an `X.Y.Z` tag, one job per npm package always runs: `release-deku-sprout`, `release-deku-swarm`, `release-navi-hey`, `release-navi-hey-client`. They replace `check-and-publish-worker`, `check-and-publish-deku-sprout` and `npm-publish`.
- Each job:
  1. runs the forgotten-bump check (`scripts/lib/package_bump_check.sh`) for its folder, using its `tag_prefix` from `release.yml` (none for `navi-hey`). The helper already falls back to the last `X.Y.Z` tag, so the old `worker-` / `deku-sprout-` tags are not needed. `SKIP_BUMP_CHECK=true` still skips it;
  2. waits until every `release.yml` dependency's current version is visible on npm (`wait-for-npm`; instant when that dependency no-oped);
  3. publishes when `npm view <package>@<version> version` returns nothing or a 404, and no-ops when the version is already there (any other `npm view` error fails the job);
  4. after publishing, waits until its own version is visible on npm.
- `release-navi-hey` keeps its extra steps before publishing: `build-frontend` and `pin-local-deps`.
- Job order mirrors `release.yml`. Each job waits for its dependencies' jobs, whether they released or no-oped. All of them wait for the tests, `check-version-tag`, `validate-release-yml` and `cascade-bump-check`, i.e. everything `npm-publish` requires today:
  - `release-navi-hey` requires `release-deku-sprout` and `release-deku-swarm`;
  - `release-navi-hey-client` requires `release-deku-sprout` only;
  - `build-and-release` requires `release-navi-hey` instead of `npm-publish`.
- No git tag is pushed any more: tag pushing and the `GITHUB_TOKEN` check move out of the script. Until #988 adds the separate tag-push job, no `sprout-` / `swarm-` / `node_client-` tags are pushed. This gap is accepted.
- `DRY_RUN=1` still prints what would be published instead of publishing.

## Solution

- Generalize `scripts/ci/check-and-publish-package.sh` into one script taking a `release.yml` package name. It reads that package's `folder`, `tag_prefix` and `depends_on` from `release.yml` through a small node helper in `scripts/release/` (reusing `loadReleaseTree`).
- Expose it through `scripts/ci.sh` (e.g. `release-npm <package>`), and remove the `check-and-publish-worker` / `check-and-publish-deku-sprout` wrappers and their `ci.sh` entries.
- `.circleci/config.yml` keeps a static job graph: four hand-written `release-<pkg>` jobs whose `requires` mirror `release.yml`. There is no dynamic config and no automated sync check.
- `navi-hey-client` needs no dependency pinning, since it depends on `deku-sprout` from npm (`^0.3.0`), not `file:`.
- `build-and-release-client` / `update-description-client` stay unwired; #987 handles the images.
- Update the agent docs that describe the old jobs: `docs/agents/release-token.md`, `docs/agents/logger.md`, and the worker / client agent docs where they mention the publish jobs or the tag push. Leave `docs/agents/specs/release/` and the user-facing docs (#989) alone.
- Detection is by published version, not by diffing files. See `docs/agents/specs/release/detection.md` and `ci-flow.md`.

## Ownership

architect (`scripts/ci/`, `scripts/release/`, `scripts/ci.sh`, `.circleci/config.yml`, `docs/agents/`).

## Dependencies

#983 (`release.yml`) and #985 (restrict CI triggers) of #977, both done or planned.

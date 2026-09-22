# Issue: Add the deku-sprout CI and release flow

## Description
Part 5 of 7 of #888. Add the CI and release flow for `deku-sprout` (`logger/`), mirroring `deku-swarm`'s (`worker/`). This has to land — and the package has to be published to npm at least once — before the Node client can depend on it, since `navi-hey-client` consumers install from the npm registry and cannot resolve a `file:` dependency.

## Solution
Mirror what exists for `worker/` (`.circleci/config.yml`, `scripts/`):

- **CircleCI (`.circleci/config.yml`)**: `jasmine-deku-sprout` and `checks-deku-sprout` jobs (parallel to `jasmine-worker`/`checks-worker`), wired into the `test-and-release` workflow and into every `requires` list that currently includes the worker jobs (`coverage-final`, and `check-and-publish-deku-sprout` into `npm-publish`, mirroring `check-and-publish-worker`); a `force_deku_sprout_build` pipeline parameter (parallel to `force_worker_build`); a `check-and-publish-deku-sprout` job on the same `version-tag-filters` as `check-and-publish-worker`.
- **`scripts/ci.sh`**: a `check-and-publish-deku-sprout` entry, and `scripts/ci/check-and-publish-deku-sprout.sh` mirroring `check-and-publish-worker.sh` — publish `deku-sprout` to npm when `logger/` changed since the last `deku-sprout-*` tag (or when `FORCE_DEKU_SPROUT_BUILD=true`), then create and push the `deku-sprout-X.Y.Z` tag.
- **`scripts/bump_version.sh`**: a `deku-sprout` target (mirroring the `worker` target), maintaining `logger/package.json`'s version and the README's "Deku Sprout Current/Next Version" lines the same way it maintains the "Worker Current/Next Version" ones.
- **No separate "first release" action.** `check-and-publish-deku-sprout` triggers on the same app version-tag push as `check-and-publish-worker` (not a `deku-sprout`-specific tag), so the first publish happens automatically, whenever the next normal `navi-hey` release is cut — no need to force one right after this lands. Sub-issue #6 (link consumers) simply waits until `deku-sprout` shows up on npm.

## Benefits
- `deku-sprout` is released automatically, the same way `deku-swarm` already is, and becomes available on npm for `navi-hey-client` to depend on once the next `navi-hey` release ships

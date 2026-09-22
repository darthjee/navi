# Add the check-and-publish-deku-sprout job and script

Add the change-detecting publish path for `deku-sprout`, mirroring `check-and-publish-worker` end to end: a new pipeline parameter, a CircleCI job on the version-tag filter, a `scripts/ci.sh` entry, and the underlying script that decides whether to publish and tags the release.

`scripts/ci/check-and-publish-deku-sprout.sh` mirrors `scripts/ci/check-and-publish-worker.sh` with these substitutions: `worker/` → `logger/`, `worker-*` tag pattern → `deku-sprout-*`, `FORCE_WORKER_BUILD` → `FORCE_DEKU_SPROUT_BUILD`, `deku-swarm` npm package name → `deku-sprout`, `WORKER_VERSION`/`worker-$VERSION` → `DEKU_SPROUT_VERSION`/`deku-sprout-$VERSION` (version read from `logger/package.json`), and `bash "$DIR/../ci.sh" install-deps worker true` / `publish worker` → `install-deps logger true` / `publish logger`. Same idempotency behavior: skip the npm publish if the version already exists on npm, skip the tag push if the tag already exists locally or on `origin`.

`check-and-publish-deku-sprout` (the CircleCI job) is added to `npm-publish`'s `requires` list alongside `check-and-publish-worker`, per the discuss-issue decision to mirror worker's gating exactly.

## Files to Change

- `scripts/ci/check-and-publish-deku-sprout.sh` — new script, adapted from `scripts/ci/check-and-publish-worker.sh` as described above.
- `scripts/ci.sh` — add a `check-and-publish-deku-sprout)` case dispatching to the new script.
- `.circleci/config.yml`:
  - add a `force_deku_sprout_build` boolean pipeline parameter (default `false`), alongside `force_worker_build`.
  - add a `check-and-publish-deku-sprout` job definition (mirrors `check-and-publish-worker`'s job: `checkout` + a `run` step invoking `FORCE_DEKU_SPROUT_BUILD=<< pipeline.parameters.force_deku_sprout_build >> scripts/ci.sh check-and-publish-deku-sprout`).
  - add `check-and-publish-deku-sprout` to the workflow's `jobs:` list with `filters: *version-tag-filters` (same filter as `check-and-publish-worker`).
  - append `check-and-publish-deku-sprout` to `npm-publish`'s `requires: [...]` list.

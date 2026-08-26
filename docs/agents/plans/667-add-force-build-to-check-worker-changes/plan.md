# Plan: Add Force Build To Check Worker Changes

Issue: [667-add-force-build-to-check-worker-changes.md](../issues/667-add-force-build-to-check-worker-changes.md)

## Overview

Consolidate the `deku-swarm` (`worker/`) release into navi's own `\d+.\d+.\d+`
release pipeline: replace the advisory-only `check-worker-changes` CI job with
a `check-and-publish-worker` job that detects `worker/` changes (or an
explicit `force_worker_build` pipeline parameter), and idempotently publishes
`deku-swarm` to npm and pushes a `worker-x.y.z` tag before `npm-publish` runs.
The now-redundant separate `worker-x.y.z`-tag-triggered release path
(`check-worker-version-tag`/`npm-publish-worker`) is removed.
`scripts/ci/build-frontend.sh`'s `deku-swarm` version substitution — also
called out as broken in the issue — was already fixed in a prior commit
(`b610d41`, "Fix release (#669)") and needs no further change here.

## Agents involved

- [architect](architect.md)
- [docs](docs.md)

## Shared contracts

- CircleCI **pipeline parameter** `force_worker_build` (boolean, default
  `false`), exposed to job scripts as env var `FORCE_WORKER_BUILD`
  (`"true"`/`"false"` string).
- New job name: `check-and-publish-worker` (replaces `check-worker-changes`;
  same `version-tag-filters`, i.e. still gated on navi's `\d+\.\d+\.\d+`
  release tag). `npm-publish`'s `requires` list now includes
  `check-and-publish-worker` instead of `check-worker-changes`.
- New script: `scripts/ci/check-and-publish-worker.sh`, invoked via
  `scripts/ci.sh check-and-publish-worker`.
- New CircleCI project environment variable name (provisioning it in
  CircleCI's project settings is a manual step, out of scope for this code
  change — but the script and documentation must agree on the name):
  `GH_PUSH_TOKEN` — a GitHub PAT (fine-grained: repository access scoped to
  `darthjee/navi` with **Contents: Read and write**; classic alternative:
  `repo` scope) used only by `check-and-publish-worker.sh` to push the
  `worker-x.y.z` tag.
- Git tag convention is unchanged: `worker-<worker_version>` (e.g.
  `worker-1.7.1`), matching `worker/package.json`'s version and the existing
  `README.md` "Worker Current Version" badge.
- Removed: the `check-worker-version-tag` and `npm-publish-worker` jobs, the
  `worker-tag-filters` YAML anchor, `scripts/ci/check-worker-changes.sh`, and
  `scripts/check_worker_tag_version.sh`.

## Notes

- `architect` (not merely the coordinating role) is listed here as a full
  implementing participant because this issue's primary work —
  `.circleci/config.yml` and `scripts/` — falls under the architect's own
  root-level scope, not any layer specialist's. `docs` participates only for
  the `README.md` release-flow documentation.
- `scripts/ci/build-frontend.sh`'s substitution bug was already fixed by
  commit `b610d41` ("Fix release (#669)") prior to this plan — no action
  needed on it; this plan focuses on the CI-job consolidation and cleanup.

# Plan: Add the deku-sprout CI and release flow

Issue: [915-add-the-deku-sprout-ci-and-release-flow.md](../issues/915-add-the-deku-sprout-ci-and-release-flow.md)

## Overview

Give `deku-sprout` (`logger/`) the same CI test/lint/publish wiring `deku-swarm` (`worker/`) already has: dedicated CircleCI test and lint jobs, a change-detecting publish job gated on the app's own version-tag release, and a `bump_version.sh` target. This is purely root-level/cross-cutting work (`.circleci/config.yml`, `scripts/`) — none of it touches `logger/` itself, so it has no specialist-agent owner and is implemented directly.

## Context

Part 5 of 7 of #888. `navi-hey-client` (sub-issue #6) can only depend on `deku-sprout` once it is resolvable from the npm registry, so this CI/publish wiring has to land — and produce at least one real publish — before that sub-issue starts. Per the discuss-issue dialogue on #915: `check-and-publish-deku-sprout` blocks `npm-publish` exactly like `check-and-publish-worker` does today, and there is no separate "first release" action — the first publish happens automatically the next time a normal `navi-hey` version tag is pushed, since no prior `deku-sprout-*` tag exists yet (mirrors how `check-and-publish-worker.sh` treats a missing `worker-*` tag as "release recommended").

## Steps

- [01 — Add jasmine-deku-sprout and checks-deku-sprout CircleCI jobs](plan/01-add-test-and-lint-jobs.md)
- [02 — Add the check-and-publish-deku-sprout job and script](plan/02-add-check-and-publish-job.md)
- [03 — Add a deku-sprout target to bump_version.sh](plan/03-add-bump-version-target.md)

## Notes

- No CI job exercises `.circleci/config.yml` or `scripts/*.sh` themselves — verify by pushing the branch and watching the new jobs run in CircleCI (and, optionally, a manual pipeline run with `force_deku_sprout_build=true` against a version tag to dry-run the publish path without waiting for a real `navi-hey` release).
- `logger/package.json` is currently at version `0.1.0`; the first automatic publish ships that version as `deku-sprout@0.1.0` and tags `deku-sprout-0.1.0`.

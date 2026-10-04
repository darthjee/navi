# Plan: Remove standalone deku-sprout release track: duplicate publish fails release with npm 409

Issue: [964-remove-standalone-deku-sprout-release-track-duplicate-publish-fails-release-with-npm-409.md](../../issues/964-remove-standalone-deku-sprout-release-track-duplicate-publish-fails-release-with-npm-409.md)

## Overview
Remove the standalone `deku-sprout-X.Y.Z` CircleCI release track, so the app `X.Y.Z` tag is the only trigger that publishes `deku-sprout` (`logger/`) and `deku-swarm` (`worker/`). Stop CI-pushed marker tags (`deku-sprout-*`, `worker-*`) from starting any pipeline, delete the now-unused tag-check script, and update the docs that describe the old flow.

## Context
On release `1.13.3`, `check-and-publish-deku-sprout` published `deku-sprout@0.2.3` and pushed the `deku-sprout-0.2.3` tag. That tag started a second pipeline, whose `publish-deku-sprout-standalone` job ran `npm view` while npm was still processing the first publish. The job published again and failed with E409 "Cannot publish over previously staged version". The decision recorded in the issue is to remove the duplicate trigger: `scripts/ci/check-and-publish-package.sh` already handles the single-trigger path (bump check plus `needs_publish`). Handling npm's processing lag and the 409 is out of scope. Forgotten package bumps are covered by #965.

All touched files (`.circleci/config.yml`, `scripts/`, `docs/agents/`, `.claude/agents/`) are owned by `architect`.

## Steps

- [01 — Remove the standalone deku-sprout workflow and ignore marker tags](plan/01-circleci-config.md)
- [02 — Delete the tag-check script](plan/02-delete-tag-check-script.md)
- [03 — Update the release docs](plan/03-update-docs.md)

## CI Checks
- `.circleci/config.yml`: `circleci config validate .circleci/config.yml` (the CircleCI CLI is installed locally)
- Release script still behaves the same: `DRY_RUN=1 bash scripts/ci/check-and-publish-package.sh logger deku-sprout deku-sprout-` (no changes expected, sanity check only)

## Notes
- This can only be fully verified on the next app release that bumps `logger/`. Expected result: one pipeline (for `X.Y.Z`), no pipelines for the `deku-sprout-*` / `worker-*` marker tags, and no failed jobs.
- In CircleCI, a tag `ignore` takes precedence over `only`. Tag filters don't affect branch builds, so branches named like `worker-foo` still run CI.
- Existing `deku-sprout-*` tags and the README version links (`releases/tag/deku-sprout-X.Y.Z`) are untouched. CI keeps pushing those tags as markers, and `git describe` in the bump check still relies on them.
- Accepted trade-off: `deku-sprout` can no longer be released without an app `X.Y.Z` release (partly reverts #923).

# Issue: Extract more ci scripts to ci.sh

## Description

This is a direct continuation of the CI refactor started in #658. PR #660 completed the first phase — extracting `setup-dev`, `publish`, `coverage`, `coverage-final` into `scripts/ci/*.sh`, plus the CircleCI `executors` (`node-ci`, `scripts-ci`) and `commands` (`install-deps`, `run-tests`, `lint-and-report`) — but several jobs/commands in `.circleci/config.yml` still run shell logic inline instead of through the `scripts/ci.sh` router. This issue covers extracting the remaining inline shell blocks, following the same pattern established by PR #660.

## Problem

`.circleci/config.yml` still contains inline shell in five places instead of dispatching through `scripts/ci.sh`:

| # | Block | Current inline shell |
| --- | --- | --- |
| 1 | `install-deps` command | `yarn install` with a conditional `--frozen-lockfile` flag |
| 2 | `lint-and-report` command | `npm run lint` + `npm run report` |
| 3 | `check-worker-changes` job | `git describe` + `git diff` to detect changes under `worker/` |
| 4 | `npm-publish` job (frontend build step) | `yarn install` + `yarn build` + `cp -r` + `sed -i` (4 steps) |
| 5 | `npm-publish-worker` job (version check) | `node -p` + `npm view` + `circleci-agent step halt` |

Out of scope (deliberately left as-is):
- **`build-and-release*` jobs** — shell is minimal (`make release`, `sed`), not worth extracting.
- **Standalone scripts** — `scripts/check_tag_version.sh`, `scripts/check_client_tag_version.sh`, `scripts/check_worker_tag_version.sh`, `scripts/update-description.sh`, `scripts/update-description-client.sh`, `scripts/deploy.sh` — none of these are routed through `ci.sh` today and this issue does not route them.
- **Non-CI scripts** — `scripts/bump_version.sh`, `scripts/export_js.sh`, `scripts/export_md.sh`, `scripts/render.sh`.

## Expected Behavior

CI behavior must stay identical to today — same commands, same order, same tests. Acceptance criterion is a fully green CI run, with the same exception carried over from PR #660: Codacy step failures remain non-blocking.

## Solution

Follow the pattern established by PR #660: `scripts/ci.sh` stays a `case "$ACTION"` router that dispatches to `scripts/ci/<action>.sh`; each sub-script is self-contained (`#!/bin/bash`, `set -e`, positional args); `.circleci/config.yml` calls `scripts/ci.sh <action> [args]` instead of embedding shell.

| # | Block | New `ci.sh` action | New script |
| --- | --- | --- | --- |
| 1 | `install-deps` command | `install-deps` | `scripts/ci/install-deps.sh` |
| 2 | `lint-and-report` command | `lint-and-report` | `scripts/ci/lint-and-report.sh` |
| 3 | `check-worker-changes` job | `check-worker-changes` | `scripts/ci/check-worker-changes.sh` |
| 4 | `npm-publish` job (frontend build) | `build-frontend` | `scripts/ci/build-frontend.sh` |
| 5 | `npm-publish-worker` job (version check) | `check-npm-version` | `scripts/ci/check-npm-version.sh` |

The CircleCI `commands:` that wrap some of these (`install-deps`, `lint-and-report`) may keep their YAML declaration but call `scripts/ci.sh <action> <args>` internally instead of inline shell — preserving CircleCI command reuse while extracting the shell itself.

## Benefits

Continues consolidating CI shell logic (started in #658/#660) into small, independently testable scripts, keeping `.circleci/config.yml` declarative and making the CI logic easier to read, reuse, and run outside of CircleCI.

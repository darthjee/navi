# Plan: Extract more ci scripts to ci.sh

Issue: [664-extract-more-ci-scripts-to-ci-sh.md](../../issues/664-extract-more-ci-scripts-to-ci-sh.md)

## Overview

Continue the CI refactor started in #658/#660 by extracting the five remaining inline shell blocks in `.circleci/config.yml` into standalone scripts under `scripts/ci/`, each dispatched through the existing `scripts/ci.sh` router (`case "$ACTION"`). No behavior change — same commands, same order, same tests; only where the shell physically lives changes.

## Context

`scripts/ci.sh` already routes `setup-dev`, `publish`, `coverage`, `coverage-final` to `scripts/ci/*.sh`. Five blocks still embed shell directly in `.circleci/config.yml`:

1. `install-deps` command — conditional `yarn install [--frozen-lockfile]`
2. `lint-and-report` command — `npm run lint` + `npm run report`
3. `check-worker-changes` job — `git describe`/`git diff` to detect changes under `worker/`
4. `npm-publish` job — frontend build (`yarn install`, `yarn build`, `cp -r`, `sed -i`)
5. `npm-publish-worker` job — npm version check (`node -p`, `npm view`, `circleci-agent step halt`)

Each existing `scripts/ci/*.sh` script follows the same shape: `#!/bin/bash`, `set -e`, positional args (e.g. `scripts/ci/coverage.sh` takes the target dir as `$1`). The new scripts must follow the same shape.

## Steps

- [01 — Extract install-deps command](plan/01-install-deps.md)
- [02 — Extract lint-and-report command](plan/02-lint-and-report.md)
- [03 — Extract check-worker-changes job](plan/03-check-worker-changes.md)
- [04 — Extract npm-publish frontend build step](plan/04-build-frontend.md)
- [05 — Extract npm-publish-worker version check](plan/05-check-npm-version.md)

## CI Checks

- `.circleci/config.yml`: `circleci config validate .circleci/config.yml` (validates YAML/syntax locally; full behavioral verification only happens by pushing and watching the pipeline, per the issue's acceptance criterion)
- `scripts/ci/*.sh`: no test suite exists for these scripts (same as the ones added in PR #660); verify by running each new script directly with representative args before wiring it into the YAML

## Notes

- Preserve exact behavior: same commands, same order, same env vars/CI-only tooling (e.g. `circleci-agent step halt` in step 05 still needs the CircleCI agent binary, same as today).
- Standalone scripts (`check_tag_version.sh`, `check_client_tag_version.sh`, `check_worker_tag_version.sh`, `update-description.sh`, `update-description-client.sh`, `deploy.sh`) and `build-and-release*` jobs are explicitly out of scope — do not touch them.
- Acceptance criterion is a fully green CI run, with the same exception as PR #660: Codacy step failures remain non-blocking.

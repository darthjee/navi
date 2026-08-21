# Plan: Refactor CircleCI config

Issue: [658-refactor-circleci-config.md](../issues/658-refactor-circleci-config.md)

## Overview

`.circleci/config.yml` declares `version: 2.1` but uses none of its features, causing heavy duplication: the same Docker image is declared in ~16 jobs, the same install→test→coverage / install→lint→report step sequences repeat across 10 jobs, and non-trivial shell (Codacy upload, npm publish auth, dev-common-code copy) is inlined directly in the YAML. This plan introduces CircleCI 2.1 `executors` and `commands`, and extracts the inline shell into a router script `scripts/ci.sh` dispatching to sub-scripts under `scripts/ci/*.sh`, landing as a single PR with no change in observable job behavior.

## Context

- Neither `.circleci/` nor `scripts/` fall under any specialist agent's owned paths (`dev/`, `dockerfiles/`, `docs/guides/`, `source/`, `frontend/`, `clients/node/`, `worker/`) — this is genuinely cross-cutting, so the plan is not split by agent.
- There is no way to validate CircleCI YAML/scripts locally; acceptance is a full green CI run on the PR branch, with the existing (pre-refactor) exception that Codacy step failures are not blocking.
- Release/deploy jobs (`build-and-release*`, `update-description*`) are out of scope — they already delegate to `Makefile`/`scripts/deploy.sh`.

## Steps

- [01 — Create the CI router and sub-scripts](plan/01-create-ci-router-and-subscripts.md)
- [02 — Add executors and commands to config.yml](plan/02-add-executors-and-commands.md)
- [03 — Refactor test/check jobs to use executors and commands](plan/03-refactor-test-and-check-jobs.md)
- [04 — Refactor dev-setup, publish, and coverage-final jobs](plan/04-refactor-dev-setup-publish-and-coverage-final.md)

## CI Checks

There is no local equivalent for validating `.circleci/config.yml` changes — CircleCI's own config validator and a full pipeline run on the PR branch are the only checks. Every job in `test-and-release` (`jasmine*`, `checks*`, `coverage-final`) must stay green after each step; a Codacy upload/report failure inside those jobs is pre-existing and non-blocking.

## Notes

- Keep behavior identical: this is a structural refactor of the YAML/scripts, not a change to what commands run, what gets tested, or what gets published.
- Filters (`tags: only: /.*/`, version-tag patterns) are left declarative as-is — low complexity, no clear benefit from further abstraction into a command.
- `scripts/ci.sh` and its sub-scripts should be executable (`chmod +x`) and use `set -e` so failures propagate to the CircleCI step, consistent with `scripts/check_tag_version.sh`.

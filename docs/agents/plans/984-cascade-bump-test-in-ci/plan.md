# Plan: Cascade-bump test in CI

Issue: [984-cascade-bump-test-in-ci.md](../../issues/984-cascade-bump-test-in-ci.md)

## Overview

Add a cascade-bump check to the `scripts/release/` package (`navi-release-scripts`, from #983). For every npm entry of `release.yml` whose `package.json` `version` changed between a base ref and `HEAD`, every package depending on it (directly or transitively) must also have changed its version. A CI job runs it on branches and `X.Y.Z` tags.

## Context

- `release.yml` and `loadReleaseTree(rootDir)` already exist; entries are normalized to `{ folder, platform, dependsOn, tagPrefix }`.
- Comparison base, settled in the issue:
  - PR branches: `git merge-base HEAD origin/main`;
  - `X.Y.Z` tags: the previous `X.Y.Z` tag reachable from `HEAD^`;
  - `main`: `HEAD^`;
  - no base found: pass with a message.
- Docker entries are not checked on their own: they follow their folder's `package.json` version.
- A package missing at the base ref counts as not bumped.
- Version bump only: no semver range check.

## Steps

- [01 — Cascade check module](plan/01-cascade-check-module.md)
- [02 — Git helpers and base-ref resolution](plan/02-git-helpers.md)
- [03 — CLI, ci.sh action and CI job](plan/03-cli-and-ci-job.md)
- [04 — Docs](plan/04-docs.md)

## CI Checks

- `scripts/release`: `cd scripts/release && npm test` (CI job: `jasmine-release`)
- `scripts/release`: `cd scripts/release && npm run lint` (CI job: `checks-release`)
- root: `scripts/ci.sh cascade-bump-check` (CI job: `cascade-bump-check`)
- root: `scripts/ci.sh validate-release-yml` (CI job: `validate-release-yml`) must keep passing.

## Notes

- CircleCI's `checkout` step clones the full history with tags, but `origin/main` may not be present as a remote-tracking ref on tag builds; the CI script runs `git fetch origin main --tags` (best-effort) before checking.
- On a branch whose merge base equals `HEAD` (e.g. a fresh branch at `main`), nothing differs and the check passes.
- Once #985 restricts triggers, the job's `*all-tags` filter changes with the others; nothing extra is needed here.

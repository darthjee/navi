# Plan: Extract common CircleCI tag filters into YAML anchors

Issue: [661-extract-common-circleci-tag-filters-into-yaml-anchors.md](../../issues/661-extract-common-circleci-tag-filters-into-yaml-anchors.md)

## Overview

`.circleci/config.yml`'s `test-and-release` workflow repeats identical `filters` blocks across 25 jobs. This plan replaces that duplication with four YAML anchors, defined inline at each pattern's first occurrence and referenced everywhere else via aliases, with zero change to which jobs run under which tag/branch conditions.

## Context

Two distinct filter shapes repeat:
- `filters.tags.only: /.*/` (no `branches` filter) — 13 jobs.
- `filters.tags.only: <version pattern>` + `branches.ignore: /.*/` — 12 jobs, split across three tag patterns: plain `/\d+\.\d+\.\d+/` (7 jobs), `client-` prefixed (4 jobs), `worker-` prefixed (2 jobs).

Since the whole `filters:` block (not just `tags:`) is identical within each group, the anchor covers the whole block. YAML requires an anchor to be defined before any alias references it; the jobs list's existing order already puts each pattern's first occurrence before all later ones, so anchors are defined inline (no separate anchor block, no reordering):
- `&all-tags` on `jasmine` (first job in the workflow)
- `&version-tag-filters` on `check-version-tag`
- `&client-tag-filters` on `check-client-version-tag`
- `&worker-tag-filters` on `check-worker-version-tag`

## Implementation Steps

### Step 1 — Anchor and alias the `/.*/` tag filter

In `.circleci/config.yml`, on the first job (`jasmine`), change:
```yaml
filters:
  tags:
    only: /.*/
```
to:
```yaml
filters: &all-tags
  tags:
    only: /.*/
```
Then replace the identical inline `filters` block on the remaining 12 jobs that use this pattern (`checks`, `jasmine-dev`, `checks-dev`, `jasmine-dev-frontend`, `checks-dev-frontend`, `checks-frontend`, `jasmine-frontend`, `jasmine-client`, `checks-client`, `jasmine-worker`, `checks-worker`, `coverage-final`) with `filters: *all-tags`.

### Step 2 — Anchor and alias the version-tag filters

For each of the three version-tag groups, anchor the `filters` block on the first job in file order and alias it on the rest:
- `&version-tag-filters` (`tags.only: /\d+\.\d+\.\d+/` + `branches.ignore: /.*/`) on `check-version-tag`; alias (`*version-tag-filters`) on `check-worker-changes`, `npm-publish`, `build-and-release`, `update-description`, `build-and-release-demo`, `build-and-release-demo-app`.
- `&client-tag-filters` (`tags.only: /client-\d+\.\d+\.\d+/` + `branches.ignore: /.*/`) on `check-client-version-tag`; alias (`*client-tag-filters`) on `npm-publish-client`, `build-and-release-client`, `update-description-client`.
- `&worker-tag-filters` (`tags.only: /worker-\d+\.\d+\.\d+/` + `branches.ignore: /.*/`) on `check-worker-version-tag`; alias (`*worker-tag-filters`) on `npm-publish-worker`.

## Files to Change

- `.circleci/config.yml` — define the four anchors inline at each pattern's first occurrence and replace every other occurrence of the same `filters` block with the matching alias. No other change (job order, `requires:`, executors, commands, `branches` semantics all stay exactly as they are today).

## CI Checks

- `.circleci`: `circleci config validate .circleci/config.yml` (checks the YAML/CircleCI schema is still valid after the anchor rewrite; it does not by itself prove tag-trigger behavior is unchanged — that's covered by the acceptance criterion below).

## Notes

- Acceptance for this issue is a full CI run on the PR with every job passing/triggering exactly as before — `circleci config validate` only catches syntax errors, not behavioral drift, so the actual PR pipeline run is the real check.
- No specialist agent in this repo owns `.circleci/`; this plan is a single cross-cutting `plan.md` (no agent split).

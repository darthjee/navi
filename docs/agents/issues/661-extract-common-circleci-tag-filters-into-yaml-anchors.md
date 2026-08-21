# Issue: Extract common CircleCI tag filters into YAML anchors

## Description
Follow-up to #658. The CircleCI refactor in #658 (PR #660) deliberately left the `filters.tags` blocks in `workflows.test-and-release.jobs` as declarative inline duplication. Extract them into reusable YAML anchors instead.

## Problem
`.circleci/config.yml`'s `test-and-release` workflow repeats the same two tag-filter blocks across many jobs:

| Pattern | Occurrences |
| --- | --- |
| `tags: only: /.*/` | 13 jobs |
| `tags: only: /\d+\.\d+\.\d+/` and its `client-`/`worker-` prefixed variants | 7 jobs |

This is plain YAML duplication with no CircleCI-specific behavior involved, so it can be deduplicated with native YAML anchors/aliases rather than CircleCI 2.1 `executors`/`commands` (which #658 already covers for the job bodies).

## Expected Behavior
- Reusable YAML anchors are defined for the repeated `filters` blocks (e.g. `&all-tags` for `/.*/`, plus anchors for the version-tag `filters` blocks — tags pattern + `branches: ignore: /.*/` together — including the `client-`/`worker-` variants where the pattern itself repeats).
- Every job in `workflows.test-and-release.jobs` that currently inlines one of these filter blocks references the anchor via a YAML alias instead.
- Workflow behavior is unchanged — the CircleCI config still runs the exact same jobs under the exact same tag/branch conditions as before.
- Acceptance requires a full CI run on the PR with all jobs passing/triggering exactly as before this change.

## Solution
Scoped entirely to `workflows.test-and-release.jobs` filter declarations in `.circleci/config.yml`:
- Define each anchor inline, on the first job (in file order) that uses that pattern — not hoisted into a separate top-of-file anchor block. YAML requires an anchor to be defined before any alias references it, and the jobs list's existing order already puts the first occurrence of every pattern before all later ones, so no reordering or extra structure is needed:
  - `&all-tags` on `jasmine` (first job in the workflow)
  - `&version-tag-filters` on `check-version-tag`
  - `&client-tag-filters` on `check-client-version-tag`
  - `&worker-tag-filters` on `check-worker-version-tag`
- Replace each duplicated inline `filters` block with an alias to the corresponding anchor.
- No changes to `executors`, `commands`, or `scripts/ci*` introduced by #658 — this is limited to the workflow's filter declarations.

### Anchor design
Investigation of the current file shows every version-tag job also repeats an identical `branches: ignore: /.*/` alongside its `tags` pattern — so the anchor covers the **whole `filters:` block** (tags + branches together) wherever that whole block repeats identically, not just the `tags` sub-block. Four anchors cover all 25 jobs in the workflow:

| Anchor | Covers | Used by |
| --- | --- | --- |
| `&all-tags` | `filters.tags.only: /.*/` (no branches filter) | 13 jobs (`jasmine*`, `checks*`, `coverage-final`) |
| `&version-tag-filters` | `tags.only: /\d+\.\d+\.\d+/` + `branches.ignore: /.*/` | 7 jobs (`check-version-tag`, `check-worker-changes`, `npm-publish`, `build-and-release`, `update-description`, `build-and-release-demo`, `build-and-release-demo-app`) |
| `&client-tag-filters` | `tags.only: /client-\d+\.\d+\.\d+/` + `branches.ignore: /.*/` | 4 jobs (`check-client-version-tag`, `npm-publish-client`, `build-and-release-client`, `update-description-client`) |
| `&worker-tag-filters` | `tags.only: /worker-\d+\.\d+\.\d+/` + `branches.ignore: /.*/` | 2 jobs (`check-worker-version-tag`, `npm-publish-worker`) |

Each job's `filters:` key becomes a single alias, e.g.:
```yaml
- check-version-tag:
    filters: &version-tag-filters
      tags:
        only: /\d+\.\d+\.\d+/
      branches:
        ignore: /.*/
- check-worker-changes:
    filters: *version-tag-filters
```

## Out of Scope
- Any change to executors, commands, or the `scripts/ci.sh` router/sub-scripts from #658.
- Any change to job logic, release/deploy jobs, or the *content* of any filter (only deduplicating the existing, identical `filters` blocks via YAML anchors — the resulting CircleCI behavior for every job is unchanged).

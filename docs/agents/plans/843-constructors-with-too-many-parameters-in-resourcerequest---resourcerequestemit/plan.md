# Plan: Constructors with too many parameters in ResourceRequest / ResourceRequestEmit

Issue: [843-constructors-with-too-many-parameters-in-resourcerequest---resourcerequestemit.md](../issues/843-constructors-with-too-many-parameters-in-resourcerequest---resourcerequestemit.md)

## Overview

Codacy/Lizard flags `ResourceRequest`'s and `ResourceRequestEmit`'s constructors, and their test factories' `build` methods, for exceeding the parameter-count threshold. All four already take a single destructured options object — the pattern the check exists to encourage — so Lizard is counting destructured properties as separate parameters, a false positive against already-idiomatic code. No constructor/factory signature change is warranted.

This plan is a **manual checklist, not a code change**. Confirmed via the Codacy API (`codacy_list_repository_tools`, `codacy_list_repository_issues`): the `Lizard` tool has no repo-side configuration file (`usesConfigurationFile: false`), and no automated write path exists to disable a pattern or mark an issue as a false positive — both require the Codacy web dashboard. There is nothing to commit or open a PR for on the constructor side.

## Context

- Flagged (all 4 currently open per the Codacy API, not stale):
  - `source/lib/models/request/resource_request/ResourceRequest.js:45` — constructor, 12 parameters
  - `source/lib/models/request/resource_request/ResourceRequestEmit.js:64` — constructor, 10 parameters
  - `source/spec/support/factories/ResourceRequestFactory.js:21` — `build`, 9 parameters
  - `source/spec/support/factories/ResourceRequestEmitFactory.js:22` — `build`, 10 parameters
- `source/spec/support/factories/` is listed under `excluded_paths` in `.codacy.yaml` (added in #71), but the two factories above are still actively flagged — the exclusion is not being honored for the Lizard tool.
- No specialist agent in `.claude/agents/` owns this: it touches no `source/` (engine), `frontend/`, `worker/`, etc. code, only Codacy's own project configuration, which lives outside the repo.

## Implementation Steps

### Step 1 — Suppress the parameter-count false positive (manual, Codacy dashboard)

In the Codacy dashboard for `darthjee/navi` (Project Settings → Code Patterns → Lizard), either:
- disable pattern `Lizard_parameter-count-medium` for JavaScript, or
- mark the 4 specific open issues as false positives individually (preferred if the pattern still has value elsewhere in the repo):
  - `ResourceRequest.js:45`
  - `ResourceRequestEmit.js:64`
  - `ResourceRequestFactory.js:21`
  - `ResourceRequestEmitFactory.js:22`

### Step 2 — Fix the `.codacy.yaml` exclusion gap (manual, Codacy dashboard)

Investigate why `excluded_paths: source/spec/` in `.codacy.yaml` isn't preventing Lizard from scanning `source/spec/support/factories/*.js`. Since Lizard doesn't use a repo config file, check the dashboard's own "ignored files" / coding-standards settings for a matching exclusion, and add one there if `.codacy.yaml` alone isn't sufficient for this tool.

## Files to Change

None — no repository file needs to change to resolve this issue. (The issue file itself was already updated with these findings as part of discussion.)

## Notes

- This issue cannot be closed by `auto-fix-issue`/a pull request — both steps are manual actions in the Codacy dashboard by someone with admin access to the `darthjee/navi` Codacy project.
- Once both steps are done, confirm via `codacy_list_repository_issues` (pattern `Lizard_parameter-count-medium`) that the 4 issues no longer appear as open.

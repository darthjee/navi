# Frontend Plan: Reduce Codacy duplication in Job status and JobsView specs

Main plan: [plan.md](plan.md)

## Overview
All changes live in `frontend/spec/`; no production code (`frontend/src/`) is touched. Every existing scenario and assertion must be preserved — only the way they are declared changes.

## Context
Codacy reports 18% duplication (goal: 10%). `Job_status_spec.js` (18 clones) and `JobsView_spec.js` (6 clones) are the targets. `support/async.js` already exports `flushAsync` (and `Job_spec.js` already uses it), so only the router `renderJob` still needs to be extracted. `JobsView_spec.js` is really a `JobsController` unit spec (no rendering), so it is renamed to `JobsController_spec.js` and moved next to the other controller specs.

## Steps

- [01 — Share renderJob and flushAsync](frontend/01-share-render-job.md)
- [02 — Drive Job status scenarios by data](frontend/02-job-status-scenarios-as-data.md)
- [03 — Rename and de-duplicate the JobsController spec](frontend/03-jobs-controller-spec.md)

## CI Checks
- `frontend`: `docker compose run --rm navi_frontend bash -c "yarn coverage && yarn lint && yarn report"` (CI jobs: `jasmine-frontend`, `checks-frontend`)

## Notes
- Prefer readability over maximal de-duplication: failing spec names must still read clearly (e.g. "does not show Last error").
- The generated spec names for the `visible`-driven loop should match the existing ones ("shows remaining attempts", "does not show Ready in", ...) so test history stays comparable.
- Do a before/after spec-count comparison (`yarn spec` totals) — the count of specs should be unchanged for `Job status rendering` and `JobsController`.
- Codacy figures come from `main` at `f25bf98`; confirm the improvement on the PR's Codacy report.

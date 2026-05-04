# Plan: Add Logs Button

## Overview

Add a "Logs" navigation button to the `StatsHeader` bar, placed after the job-stats section and styled consistently with the existing `StatItem` cards. The button links to `/#/logs`, which is already a registered route for `LogsPage`.

## Context

- The `StatsHeader` component renders worker stats (`StatItem`) and per-status job counts (`JobStatItem`) in a horizontal flex bar.
- `StatItem` already accepts an optional `to` prop and renders as a `Link` when provided.
- `LogsPage.jsx` and the `/logs` route already exist — only the navigation entry point is missing.
- The GitHub issue body mentions `/#/jobs` as the target, but the actual target is `/#/logs` (the `LogsPage` route), which is also the default redirect from `/`.

## Implementation Steps

### Step 1 — Extend `StatItem` to support value-less cards

`StatItem` currently always renders a large `value` above a small `label`. For the Logs button there is no numeric value — the card should display only the label as the primary text.

Add an optional `children` prop (or a `text`-only rendering mode) so a `StatItem` can render a single centered text without the two-tier `value` / `label` layout.
Alternatively, keep the existing layout but accept `undefined` as `value` and render only `label` when `value` is absent.

### Step 2 — Add the Logs button to `StatsHeaderHelper`

In `StatsHeaderHelper.render()`, after the jobs `<div>` and before the closing wrapper, add:
- A vertical separator (`<div className="vr mx-1" />`).
- A `StatItem` (or a thin dedicated `LogsButton` element) with `to="/logs"`, styled with a suitable Bootstrap variant (e.g., `info`), displaying the label `"Logs"`.

### Step 3 — Add or update tests

Add or update the Jasmine spec for `StatsHeaderHelper` to assert that the rendered output includes the Logs link pointing to `/logs`.

## Files to Change

- `frontend/src/components/elements/StatItem.jsx` — optionally support label-only rendering (no numeric value).
- `frontend/src/components/elements/helpers/StatsHeaderHelper.jsx` — add Logs `StatItem` with `to="/logs"` after a `vr` separator.
- `frontend/spec/…/StatsHeaderHelper_spec.js` (or equivalent) — add test coverage for the new button.

## Notes

- The `/logs` route already exists in `main.jsx`; no routing changes are required.
- The GitHub issue body says `/#/jobs` but the correct target is `/#/logs` — confirm with the user if unsure.
- Keep the change minimal: do not refactor `StatItem` beyond what is needed for this button.
- If a label-only mode makes `StatItem` too complex, a small purpose-built `LogsButton.jsx` element is an acceptable alternative.

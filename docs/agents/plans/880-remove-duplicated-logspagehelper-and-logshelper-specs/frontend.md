# Frontend Plan: Remove duplicated LogsPageHelper and LogsHelper specs

Main plan: [plan.md](plan.md)

## Overview
`frontend/spec/components/LogsPageHelper_spec.js` and `frontend/spec/components/helpers/LogsHelper_spec.js` are byte-identical apart from the class name and import path. Both helpers produce the same DOM (`LogsPageHelper` renders inline; `LogsHelper` delegates to `LogsPanel`), so one shared behavioural example can cover both.

## Context
`frontend/spec/support/logs.js` already hosts shared logs-terminal examples (`itBehavesLikeLogsTerminal`, `logEntries`, and the internal `itRendersAnEmptyTerminal` / `itRendersEntries`) used by `Logs_spec`, `LogsPage_spec` and `LogsPanel_spec`. Support files are plain modules exporting functions (no top-level `describe`/`it`); `useContainer()` and `renderInAct` come from `frontend/spec/support/dom.js`.

## Implementation Steps

### Step 1 — Add a shared `itBehavesLikeLogsHelper(HelperClass)` example
In `frontend/spec/support/logs.js`, add and export `itBehavesLikeLogsHelper(HelperClass)`. It registers:
- `.build` — returns a `HelperClass` instance (`toBeInstanceOf`).
- `#render` — uses `useContainer()` and `renderInAct`, building the helper with `HelperClass.build(...)` and rendering with `helper.render(bottomRef)` (`const bottomRef = { current: null }`).
  - `with no log entries` — reuse `itRendersAnEmptyTerminal(state)`, keeping every existing assertion (terminal container, `text-light`, no non-empty rows).
  - `with log entries` — reuse `itRendersEntries(state)` and keep explicit examples for: row count `logEntries.length + 1` (bottomRef sentinel div) and the bracketed `[timestamp]` / `[level]` text, so no existing scenario is lost. The shared fixture (`logEntries`) replaces the spec-local 4-entry list.
Do not call `describe`/`it` at module top level.

### Step 2 — Slim down both specs and verify
Reduce both spec files to a `describe('<Class>', () => { itBehavesLikeLogsHelper(<Class>); });` with the import of the class and of the shared example:
- `frontend/spec/components/LogsPageHelper_spec.js` (imports `../../src/components/pages/helpers/LogsPageHelper.jsx`, `../support/logs.js`)
- `frontend/spec/components/helpers/LogsHelper_spec.js` (imports `../../../src/components/elements/helpers/LogsHelper.jsx`, `../../support/logs.js`)

Verify: `yarn spec` (glob is shell-expanded, so it does NOT include `spec/components/helpers/`), so also run explicitly `NODE_OPTIONS='--import ./spec/support/loader.js' node_modules/.bin/jasmine spec/support/dom.js spec/components/LogsPageHelper_spec.js 'spec/components/helpers/*_spec.js'`, then `yarn coverage`, `yarn lint`, `yarn report`. Moving `LogsHelper_spec.js` so CI runs it is out of scope.

## Files to Change
- `frontend/spec/support/logs.js` — add and export `itBehavesLikeLogsHelper(HelperClass)`.
- `frontend/spec/components/LogsPageHelper_spec.js` — reduce to the shared example call.
- `frontend/spec/components/helpers/LogsHelper_spec.js` — reduce to the shared example call.

## CI Checks
- `frontend`: `docker compose run --rm navi_frontend bash -c "yarn coverage && yarn lint && yarn report"` (CI jobs: `jasmine-frontend`, `checks-frontend`)

## Notes
- No production code changes.
- Do not use a `_spec.js` suffix for support files; the new example lives in the existing `logs.js`.
- `.codacy.yaml` excludes `frontend/spec/`, so the Codacy flag may come from stale results; the de-duplication is still worthwhile.
- ESLint `import/order` is alphabetized with no blank lines between groups.

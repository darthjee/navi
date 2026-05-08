# Issue: Reduce Complexity in frontend/specs

## Description

Some test files under `frontend/spec` have grown too complex and need to be simplified to improve maintainability, readability, and overall test quality. This is the frontend counterpart of issue #540 (which covered `source/spec/lib`).

The test suite contains **26 files** and **3,502 lines** in `frontend/spec/`. Four recurring anti-patterns account for most of the complexity.

## Problem

- Certain test files in `frontend/spec` have accumulated too much complexity over time.
- High complexity makes tests harder to read, maintain, and debug.
- Recurring patterns: deeply nested `describe` blocks, duplicated fetch mock setup, repeated component DOM setup, and copy-pasted status-scenario structures.

## Top Offenders

| File | Lines | Describes | Its | beforeEach | Max Depth |
|------|-------|-----------|-----|-----------|-----------|
| Job_status_spec.js | 267 | 7 | 26 | 7 | 7 |
| EngineClient_spec.js | 203 | 19 | 18 | 12 | **17** |
| JobsView_spec.js | 198 | 22 | 15 | 1 | 3 |
| EngineControls_spec.js | 179 | 6 | 23 | 6 | 6 |
| Job_spec.js | 179 | 5 | 21 | 5 | 5 |
| Jobs_spec.js | 179 | 6 | 19 | 6 | 6 |
| LogsClient_spec.js | 171 | 16 | 13 | 11 | 11 |
| LogsPage_spec.js | 164 | 5 | 17 | 5 | 5 |
| Logs_spec.js | 156 | 5 | 16 | 5 | 5 |
| BaseUrlsMenu_spec.js | 151 | 7 | 12 | 7 | 7 |
| StatsHeader_spec.js | 148 | 4 | 15 | 4 | 4 |
| JobsHelper_spec.js | 125 | 8 | 11 | 7 | 8 |
| LogsController_spec.js | 125 | 7 | 9 | 2 | 3 |
| JobsClient_spec.js | 122 | 10 | 9 | 4 | 6 |
| StatsClient_spec.js | 119 | 11 | 10 | 7 | 8 |

## Recurring Patterns and Strategies

### Pattern 1 — Deeply Nested Describes → Flatten or Split Files

**Found in:** `EngineClient_spec.js` (depth **17** — worst in repo), `LogsClient_spec.js` (depth 11), `Job_status_spec.js` (depth 7)

`EngineClient_spec.js` tests 6 engine status functions, each with an identical success/failure structure nested 3 levels deep, compounding into depth 17. Extract a test factory function so each function's tests are generated from a data table rather than copy-pasted nested blocks.

---

### Pattern 2 — Duplicated Fetch Mock Setup → Extract Helper

**Found in:** `EngineClient_spec.js`, `LogsClient_spec.js`, `JobsClient_spec.js`, `StatsClient_spec.js`, `JobClient_spec.js`, `BaseUrlsClient_spec.js`

Every scenario repeats a `spyOn(globalThis, 'fetch').and.returnValue(...)` `beforeEach`. Extract into shared helpers such as `mockFetchSuccess(data)` and `mockFetchFailure()` in `spec/support/`.

---

### Pattern 3 — Repeated Component DOM Setup → Shared Helper

**Found in:** `Job_spec.js`, `Jobs_spec.js`, `StatsHeader_spec.js`, `BaseUrlsMenu_spec.js`, `LogsPage_spec.js`, `Logs_spec.js`, `EngineControls_spec.js` (10+ files)

Every component test repeats the same `container = document.createElement('div')` + `createRoot` + `afterEach` unmount teardown. Extract into a shared helper in the existing `spec/support/dom.js`.

---

### Pattern 4 — Status/Scenario Repetition → Parameterised Tests

**Found in:** `Job_status_spec.js`, `BaseUrlsMenu_spec.js`, `StatsHeader_spec.js`

Multiple `describe` blocks test different states with nearly identical setup. Collapse into a `forEach` loop over a scenario data array (status name → expected UI behaviour).

---

## Expected Behavior

- Test files in `frontend/spec` are concise, focused, and easy to understand.
- Shared setup lives in `spec/support/`, not copy-pasted in every `beforeEach`.
- File nesting stays at depth ≤ 4; deeper concerns are generated via data tables or split into files.

## Solution

### Priority 1 — High Impact, Medium Effort
1. `EngineClient_spec.js` — extract engine-function test factory; reduce depth from 17 to ~3
2. `Job_status_spec.js` — parameterise status scenarios; could save ~80 lines
3. `LogsClient_spec.js` — extract fetch spy helpers; flatten nested describes
4. Add `mockFetchSuccess` / `mockFetchFailure` helpers to `spec/support/`

### Priority 2 — Medium Impact, Medium Effort
5. Extract shared DOM setup/teardown into `spec/support/dom.js` (affects 10+ component files)
6. `JobsView_spec.js` — 22 describe blocks; consider splitting by feature area
7. Standardise error-handling test patterns across all `*Client_spec.js` files

### Priority 3 — Maintenance & Quality
8. Review `JobsHelper_spec.js`, `StatsClient_spec.js` for remaining duplication
9. Document shared test utilities in `spec/support/`

## Benefits

- Easier to read and maintain test suite.
- Shared helpers mean fetch mock changes are fixed in one place.
- Reduced nesting makes test intent immediately clear.
- Faster onboarding for contributors unfamiliar with the frontend.

---
See issue for details: https://github.com/darthjee/navi/issues/543

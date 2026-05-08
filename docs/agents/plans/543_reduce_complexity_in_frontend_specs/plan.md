# Plan: Reduce Complexity in frontend/specs

## Overview

Refactor the most complex test files in `frontend/spec/` by applying four targeted strategies: extracting shared fetch mock helpers, centralising component DOM setup/teardown, converting repeated status-scenario blocks to data-driven tests, and flattening critically deep nesting via test factory functions.

## Context

26 test files / 3,502 lines live in `frontend/spec/`. The worst offender (`EngineClient_spec.js`) reaches nesting depth 17. Four recurring anti-patterns account for most complexity:

1. `spyOn(globalThis, 'fetch')` wiring duplicated in every client test scenario
2. `container` + `createRoot` + `unmount` DOM lifecycle boilerplate copy-pasted across 10+ component files
3. Multiple `describe` blocks testing different states with identical structure (status scenarios)
4. Deeply nested `describe` trees where 6 similar functions each spawn 3 more levels

A `spec/support/` folder already exists (`transform_hooks.js`, `dom.js`, `loader.js`) — new helpers extend it rather than creating a new location.

## Implementation Steps

### Step 1 — Add shared fetch mock helpers to `spec/support/`

Create (or extend) a `spec/support/fetch.js` file with:

- `mockFetchSuccess(data)` — stubs `globalThis.fetch` to resolve with `{ ok: true, json: () => Promise.resolve(data) }`
- `mockFetchFailure(status)` — stubs `globalThis.fetch` to resolve with `{ ok: false, status }`

This eliminates the repeated `spyOn(globalThis, 'fetch').and.returnValue(...)` `beforeEach` present in every `*Client_spec.js`.

---

### Step 2 — Extend `spec/support/dom.js` with a component setup helper

Add a reusable setup/teardown pair (e.g., `useContainer()`) that:

- Creates a `div`, appends it to `document.body`, and calls `createRoot`
- Returns `{ container, root, render }`
- Registers an `afterEach` that unmounts and removes the container

This removes the ~6-line `beforeEach`/`afterEach` boilerplate present in 10+ component spec files.

---

### Step 3 — Refactor `EngineClient_spec.js` (Priority 1 — depth 17)

**Problem:** 6 engine status functions tested with identical success/failure structure, compounding nesting to depth 17.

**Approach:** Define a data table of `{ functionName, endpoint, successData, ... }` and iterate with `forEach` to generate each function's `describe` block. Replace `spyOn(fetch)` with the helper from Step 1. Target depth: ≤ 4.

---

### Step 4 — Refactor `LogsClient_spec.js` (Priority 1 — depth 11)

**Problem:** `fetchLogs` and `fetchJobLogs` each have 4–5 nested scenarios with duplicated spy setup.

**Approach:** Replace per-scenario `spyOn(fetch)` with the helper from Step 1. Flatten nested `describe` blocks by merging scenario names into the `it` description where nesting adds no value.

---

### Step 5 — Refactor `Job_status_spec.js` (Priority 1 — scenario repetition)

**Problem:** 5 job status scenarios each have an inline data object + identical `beforeEach` (fetch mock + `renderJob`) + multiple `it` blocks.

**Approach:** Define a `statusScenarios` array with each status's data and expected UI assertions, then use `forEach` to generate the `describe` blocks. Replace `spyOn(fetch)` with the helper from Step 1.

---

### Step 6 — Apply DOM helper to component specs (Priority 2)

Replace the repeated `container`/`createRoot`/`unmount` boilerplate in:
- `Job_spec.js`, `Jobs_spec.js`, `EngineControls_spec.js`, `LogsPage_spec.js`, `Logs_spec.js`, `BaseUrlsMenu_spec.js`, `StatsHeader_spec.js`

and any other component spec files that follow the same pattern.

---

### Step 7 — Refactor `JobsView_spec.js` (Priority 2)

**Problem:** 22 `describe` blocks in a single file without clear grouping.

**Approach:** Group related describes by feature area and, if the file remains unwieldy, split into sibling files (e.g., `JobsView_filters_spec.js`, `JobsView_pagination_spec.js`).

---

### Step 8 — Standardise remaining `*Client_spec.js` files (Priority 2)

Apply the fetch helper from Step 1 to:
- `JobsClient_spec.js`, `StatsClient_spec.js`, `JobClient_spec.js`, `BaseUrlsClient_spec.js`

Flatten any nesting beyond depth 4 by merging scenario context into `it` descriptions.

---

### Step 9 — Review remaining files (Priority 3)

Apply helpers where applicable to:
- `JobsHelper_spec.js`, `StatsClient_spec.js` — consolidate `beforeEach` duplication
- Document the new support utilities in `spec/support/` with brief inline comments

---

## Files to Change

- `frontend/spec/support/fetch.js` *(new)* — `mockFetchSuccess` / `mockFetchFailure` helpers
- `frontend/spec/support/dom.js` *(extend)* — add `useContainer()` component setup helper
- `frontend/spec/clients/EngineClient_spec.js` — test factory; depth 17 → ≤ 4
- `frontend/spec/clients/LogsClient_spec.js` — fetch helper; flatten nesting
- `frontend/spec/clients/JobsClient_spec.js` — fetch helper
- `frontend/spec/clients/StatsClient_spec.js` — fetch helper
- `frontend/spec/clients/JobClient_spec.js` — fetch helper
- `frontend/spec/clients/BaseUrlsClient_spec.js` — fetch helper
- `frontend/spec/components/Job_status_spec.js` — parameterised status scenarios
- `frontend/spec/components/Job_spec.js` — DOM helper
- `frontend/spec/components/Jobs_spec.js` — DOM helper
- `frontend/spec/components/EngineControls_spec.js` — DOM helper
- `frontend/spec/components/LogsPage_spec.js` — DOM helper
- `frontend/spec/components/Logs_spec.js` — DOM helper
- `frontend/spec/components/BaseUrlsMenu_spec.js` — DOM helper + scenario parameterisation
- `frontend/spec/components/StatsHeader_spec.js` — DOM helper
- `frontend/spec/components/JobsView_spec.js` — reorganise / split by feature area

## Notes

- No production code changes — pure test refactor.
- Run `yarn test` (via docker-compose) after each step to ensure no `it` breaks.
- Steps 3–9 are independent of each other once Steps 1–2 are done, and can be split across PRs.
- The existing `spec/support/dom.js` may already have partial helpers — check its current content before adding to avoid duplication.
- Mirror the approach used in issue #540 (`source/spec/lib/`) for consistency across both test suites.

# Plan: Reduce Complexity of Test Files in source/specs

## Overview

Refactor the 15 most complex test files in `source/spec/lib/` by applying five targeted strategies: extracting shared stub helpers, centralising registry cleanup, converting repeated `beforeEach` blocks to data-driven tests, splitting deeply nested files, and parameterising duplicated URL resolution tests.

## Context

138 test files / 12,664 lines live in `source/spec/lib/`. Fifteen files exceed 200 lines. Four recurring anti-patterns account for most of the complexity:

1. Copy-pasted fixture/object setup in every `describe` block (worst: 16 `beforeEach` in `ConfigParser_spec.js`)
2. Repeated `spyOn(Logger/JobRegistry/...)` wiring across multiple files
3. Long `afterEach` blocks resetting 6–9 registries, duplicated across files
4. Nesting depth ≥ 3, mixing independent concerns in a single file

## Implementation Steps

### Step 1 — Create shared test utilities

Create `source/spec/support/` (or the existing support folder if it already exists) with:

- `stubs.js` — reusable spy/stub helpers (e.g., `stubLogger()`, `stubJobRegistry()`, `stubLoggerAndRegistry()`)
- `registries.js` — `resetAllRegistries()` and `resetCommonRegistries(list)` helpers

These utilities will be imported by individual spec files to eliminate boilerplate.

---

### Step 2 — Refactor `ConfigParser_spec.js` (Priority 1)

**Problem:** 16 `beforeEach` blocks; each `describe` reloads the same YAML fixtures with minor variations.

**Approach:** Convert to data-driven tests — define an array of fixture variants (file, expected values) and use a `forEach` loop to generate the `describe`/`it` blocks. Replace repeated `beforeEach` setup with shared factory helpers.

---

### Step 3 — Refactor `ResourceRequest_spec.js` (Priority 1)

**Problem:** 30 `it` blocks; URL resolution logic tested 3× with near-identical `describe`+`beforeEach` structures.

**Approach:**
- Collapse the duplicated URL resolution `describe` blocks into a single parameterised test table.
- Replace repeated `spyOn(Logger/JobRegistry)` wiring with the shared `stubLoggerAndRegistry()` helper from Step 1.

---

### Step 4 — Refactor `ResourceRequestJob_spec.js` (Priority 2)

**Problem:** Spy stub setup for `resourceRequest` methods appears 4 times; URL-resolution `describe` blocks duplicated 3×.

**Approach:**
- Extract a local or shared `stubResourceRequest()` helper.
- Collapse the URL test variants into a parameterised loop.

---

### Step 5 — Refactor `Application_spec.js` (Priority 2)

**Problem:** Nesting depth 3; 10 `beforeEach` blocks; long `afterEach` resetting 9 registries.

**Approach:**
- Replace the `afterEach` registry reset with `resetAllRegistries()` from Step 1.
- Extract the web-server scenario (depth-3 block) into a new sibling file `Application_webServer_spec.js`.
- Consolidate factory initialisation `beforeEach` blocks into a single shared setup.

---

### Step 6 — Refactor `Engine_spec.js` (Priority 2)

**Problem:** Nesting depth 3; async job scenarios mixed with synchronous ones; `stubWorkersRegistryIdleCheck` helper used only once.

**Approach:**
- Extract the async/low-success-rate scenarios into `Engine_async_spec.js`.
- Move the allocator/worker setup into a shared `beforeEach` at the top-level `describe`.
- Replace registry reset `afterEach` with `resetAllRegistries()`.

---

### Step 7 — Refactor `ResourceRequestAction_spec.js` and `ResourceRequestPaginatedAction_spec.js` (Priority 2)

**Problem:** Both files share nearly identical structure and `beforeEach` setup (9 `beforeEach` each).

**Approach:** Extract a shared setup helper (local or in support/) that both files call, reducing duplication between the pair.

---

### Step 8 — Review remaining files > 200 lines (Priority 3)

Apply the shared utilities from Step 1 to:
- `WorkersRegistry_spec.js` — consolidate 6 `beforeEach` blocks
- `HtmlParseJob_spec.js` — extract repeated spy setup
- `LoggerGroup_spec.js` / `LogBuffer_spec.js` — reduce repeated logger setup
- `JobShowSerializer_spec.js` — review for factory extraction opportunities
- `Client_spec.js` — replace registry reset `afterEach` with shared helper
- `JobRegistry_jobsByStatus_spec.js` — consolidate 12 `beforeEach` blocks

---

## Files to Change

- `source/spec/support/stubs.js` *(new)* — shared spy/stub helpers
- `source/spec/support/registries.js` *(new)* — shared registry-reset helpers
- `source/spec/lib/services/ConfigParser_spec.js` — data-driven refactor
- `source/spec/lib/models/request/ResourceRequest_spec.js` — parameterised URL tests + shared stubs
- `source/spec/lib/jobs/ResourceRequestJob_spec.js` — parameterised URL tests + stub helper
- `source/spec/lib/services/Application_spec.js` — split file + shared helpers
- `source/spec/lib/services/Application_webServer_spec.js` *(new)* — extracted web-server tests
- `source/spec/lib/services/Engine_spec.js` — split file + shared helpers
- `source/spec/lib/services/Engine_async_spec.js` *(new)* — extracted async tests
- `source/spec/lib/models/request/ResourceRequestAction_spec.js` — shared setup helper
- `source/spec/lib/models/request/ResourceRequestPaginatedAction_spec.js` — shared setup helper
- `source/spec/lib/background/WorkersRegistry_spec.js` — consolidate `beforeEach`
- `source/spec/lib/jobs/HtmlParseJob_spec.js` — extract spy setup
- `source/spec/lib/utils/logging/LoggerGroup_spec.js` — reduce logger setup duplication
- `source/spec/lib/utils/logging/LogBuffer_spec.js` — reduce logger setup duplication
- `source/spec/lib/serializers/JobShowSerializer_spec.js` — factory extraction
- `source/spec/lib/services/Client_spec.js` — shared registry reset
- `source/spec/lib/registry/JobRegistry_jobsByStatus_spec.js` — consolidate `beforeEach`

## Notes

- No production code changes — this is a pure test refactor.
- Each step should keep all existing `it` blocks passing; run the test suite after each step.
- The support utilities should be light wrappers, not a testing framework — avoid over-engineering.
- If `source/spec/support/` already exists, check its conventions before adding new files.
- Steps 2–8 are independent of each other (once Step 1 is done) and can be done in any order or split across PRs.

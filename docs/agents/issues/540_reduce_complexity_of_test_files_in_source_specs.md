# Issue: Reduce Complexity of Test Files in source/specs

## Description

Some test files under `source/specs` have grown too complex and need to be simplified to improve maintainability, readability, and overall test quality.

The test suite contains **138 files** and **12,664 lines** across `source/spec/lib`. Fifteen files exceed 200 lines and are the primary targets for refactoring.

## Problem

- Certain test files in `source/specs` have accumulated too much complexity over time.
- High complexity makes tests harder to read, maintain, and debug.
- Recurring patterns: repeated `beforeEach` setup, duplicated spy/mock wiring, deeply nested `describe` blocks, and copy-pasted fixture loading.

## Top Offenders

| File | Lines | Describes | Its | beforeEach | Max Depth |
|------|-------|-----------|-----|-----------|-----------|
| models/request/ResourceRequest_spec.js | 301 | 14 | 30 | 6 | 2 |
| services/Application_spec.js | 276 | 14 | 18 | 10 | 3 |
| services/ConfigParser_spec.js | 276 | 18 | 24 | 16 | 2 |
| jobs/ResourceRequestJob_spec.js | 275 | 11 | 21 | 9 | 2 |
| services/Engine_spec.js | 255 | 13 | 13 | 9 | 3 |
| models/request/ResourceRequestPaginatedAction_spec.js | 247 | 16 | 12 | 9 | 2 |
| utils/logging/LogBuffer_spec.js | 216 | 13 | 29 | 3 | 2 |
| models/request/ResourceRequestAction_spec.js | 214 | 16 | 12 | 9 | 2 |
| server/RouteRegister_spec.js | 213 | 5 | 12 | 1 | 2 |
| background/WorkersRegistry_spec.js | 212 | 12 | 22 | 6 | 2 |
| jobs/HtmlParseJob_spec.js | 212 | 12 | 18 | 7 | 2 |
| utils/logging/LoggerGroup_spec.js | 211 | 11 | 25 | 3 | 1 |
| serializers/JobShowSerializer_spec.js | 210 | 8 | 20 | 0 | 2 |
| services/Client_spec.js | 209 | 12 | 11 | 9 | 2 |
| registry/JobRegistry_jobsByStatus_spec.js | 201 | 17 | 16 | 12 | 2 |

## Recurring Patterns and Strategies

### Pattern 1 — Repeated Fixture/Object Setup → Extract Factories or Data-Driven Tests

**Found in:** `ConfigParser_spec.js` (worst: 16 `beforeEach`), `Application_spec.js`, `ResourceRequest_spec.js`, `Client_spec.js`, `LogBuffer_spec.js`

Each `describe` block redefines the same expected objects and loads the same fixtures. Convert to parameterized/data-driven tests or extract a shared factory helper.

---

### Pattern 2 — Repeated Spy/Mock Wiring → Extract Stub Helpers

**Found in:** `ResourceRequest_spec.js`, `ResourceRequestJob_spec.js`, `Engine_spec.js`, `Application_spec.js`

The same `spyOn(Logger, ...)`, `spyOn(JobRegistry, ...)` boilerplate appears in multiple `beforeEach` blocks across many files. Extract into shared utility functions (e.g., `stubLoggerAndRegistry()`).

---

### Pattern 3 — Repeated Registry Cleanup → Shared `afterEach` Helper

**Found in:** `Application_spec.js`, `Engine_spec.js`, `Client_spec.js`, `ConfigParser_spec.js`

Long `afterEach` blocks resetting 6–9 registries repeat across files. Centralise in a shared test utility.

---

### Pattern 4 — Deeply Nested Describes → Split Into Files

**Found in:** `Engine_spec.js` (depth 3, async job scenarios), `Application_spec.js` (depth 3, web server scenarios)

Nesting beyond depth 2 is a signal that the file covers multiple independent concerns. Split into focused sibling files (e.g., `Engine_async_spec.js`, `Application_webServer_spec.js`).

---

### Pattern 5 — Duplicated URL Resolution Tests → Parameterised Tests

**Found in:** `ResourceRequest_spec.js`, `ResourceRequestJob_spec.js`

Three or more nearly identical `describe` blocks test the same URL logic with different inputs. Collapse into a single data-driven loop or shared helper.

## Expected Behavior

- Test files in `source/specs` are concise, focused, and easy to understand.
- Shared setup lives in reusable helpers/factories, not copy-pasted `beforeEach` blocks.
- File nesting stays at depth ≤ 2; deeper concerns live in separate files.

## Solution

Apply the strategies above per file, prioritised as follows:

### Priority 1 — High Impact, Medium Effort
1. `ConfigParser_spec.js` — convert 16 `beforeEach` blocks to data-driven tests
2. `ResourceRequest_spec.js` — parameterise URL resolution tests; extract spy helpers
3. Extract shared spy/mock/registry-reset utilities used across multiple files

### Priority 2 — Medium Impact, Medium Effort
4. `Application_spec.js` — extract registry cleanup helper; flatten nesting; split web-server tests
5. `Engine_spec.js` — extract async scenarios to a separate file; extract allocator/worker setup
6. Consolidate duplicate describe blocks in `ResourceRequestJob_spec.js` and the `ResourceRequestAction`/`ResourceRequestPaginatedAction` pair

### Priority 3 — Maintenance & Quality
7. Establish test organisation conventions (one file per class method or feature area)
8. Review `LoggerGroup_spec.js`, `JobShowSerializer_spec.js`, and `WorkersRegistry_spec.js` for remaining duplication

## Benefits

- Easier to read and maintain test suite.
- Less duplication means bugs in test helpers are fixed in one place.
- Faster onboarding for contributors unfamiliar with the codebase.
- Reduced risk of regressions caused by tangled test logic.

---
See issue for details: https://github.com/darthjee/navi/issues/540

# Engine Plan: Oversized test methods (>50 LOC) in several specs

Main plan: [plan.md](plan.md)

## Shared contracts

None — this agent's work is self-contained within `source/spec/`.

## Implementation Steps

### Step 1 — Split `ConfigParser_spec.js`'s `.fromObject` describe by concern

The `describe('.fromObject', ...)` block (`source/spec/lib/services/config/ConfigParser_spec.js:23`) runs 225 lines flat, mixing several unrelated concerns: resource/client mapping, workers-config variants, missing-key errors, each sub-config (web/log/emit/extraction/failure), namespace propagation, and strict mode. Most of these are already loosely grouped by the existing `[...].forEach(...)` tables and `describe('when the config has a ... key', ...)` blocks — the fix is to make that grouping explicit and self-contained rather than relying on shared top-level `forEach` tables that span concerns.

Regroup into clearly named nested `describe` blocks, each under 50 lines, e.g.:
- `describe('resource and client mapping', ...)` — the `returns mapped resources by name`/`returns mapped clients by name` cases and their `forEach` table (lines 24–57).
- `describe('workers configuration', ...)` — the `returns the configured WorkersConfig when ...` table (lines 59–79).
- `describe('missing required keys', ...)` — the `throws an error when ...` table plus the `null` config case (lines 81–104).
- Keep the already-present `describe('when the config has a ... key', ...)` blocks for web/log/emit/extraction/failure as-is; they're already reasonably scoped.
- `describe('namespace propagation', ...)` and `describe('when strict is false', ...)` are already isolated nested describes — leave them, just verify none grow past the new outer split.

Keep the existing `parseFixture`/`buildDefaultResources` helpers; no new helpers should be needed, since the fix here is regrouping, not deduplication.

### Step 2 — Split `ResourceRequest_spec.js`'s `#hasUnresolvedTokens` describe by scenario group

The `describe('#hasUnresolvedTokens', ...)` block (`source/spec/lib/models/request/resource_request/ResourceRequest_spec.js:303`) is a single flat `forEach` over 12 parameter-case objects (lines 304–376) plus one extra `it` (lines 383–392) — 91 lines total.

Split the parameter-case table into two or three smaller nested `describe`s by scenario group, each with its own smaller `forEach`, e.g.:
- `describe('when placeholders are satisfied', ...)` — cases where `expected: false` (no placeholders, satisfied string/number/boolean, all satisfied, extra unrelated keys with a satisfied placeholder).
- `describe('when placeholders are unresolved', ...)` — cases where `expected: true` (absent, explicitly null, partially satisfied, unrelated keys without the placeholder, no arguments given).

Keep the closing `it('is equivalent to needsParams() when called with no parameters', ...)` (lines 383–392) where it is, inside `#hasUnresolvedTokens` but outside the new nested groups.

## Files to Change

- `source/spec/lib/services/config/ConfigParser_spec.js` — regroup the `.fromObject` describe into nested `describe` blocks by concern (see Step 1).
- `source/spec/lib/models/request/resource_request/ResourceRequest_spec.js` — split `#hasUnresolvedTokens`'s parameter table into two nested `describe`s by scenario group (see Step 2).

## CI Checks

- `source`: `yarn test` (or `yarn spec` for a faster run without coverage) (CI job: `jasmine`)
- `source`: `yarn lint` (CI job: `checks`)

## Notes

- Purely a test-structure refactor — no production code under `source/lib/` changes, and no test case's expectations, fixture, or assertion should change, only how they're grouped.
- After splitting, confirm `yarn test` still reports the same total number of `it` examples as before (no case silently dropped in the regroup).

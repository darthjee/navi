# Frontend Plan: Oversized test methods (>50 LOC) in several specs

Main plan: [plan.md](plan.md)

## Shared contracts

None — this agent's work is self-contained within `frontend/spec/`.

## Implementation Steps

### Step 1 — Tidy `ExtensionRoutes_spec.js`'s `extension routes integration` describe block

Codacy/Lizard originally attributed 86 lines to the `buildExtensionRoutes` helper (`frontend/spec/components/ExtensionRoutes_spec.js:19`), but as confirmed during discussion that helper is only 10 lines (19–28) — the report is a Lizard/Codacy measurement artifact, likely from brace-matching confusion around the nested `React.createElement`/object-literal calls in this file, not a genuine oversized function. Leave `buildExtensionRoutes`, `buildTree`, and `renderTree` as they are.

The enclosing `describe('extension routes integration', ...)` block (lines 54–104, ~51 lines) is only marginally over the guideline. Tidy it by grouping related setup rather than a structural rewrite:
- Extract the repeated `spyOn(globalThis, 'fetch')` fake response used in `beforeEach` (lines 59–64) into a small named helper (e.g. `stubExtensionsFetch()`) if that shortens the top-level `beforeEach` enough to bring the block under 50 lines on its own.
- If that alone isn't sufficient, split the `describe('when an extension component throws on render', ...)` sub-block (lines 90–103) out slightly further — e.g. moving its `beforeEach` console spies (lines 93–96) into a locally named helper — without changing any assertions.

Keep all four existing nested `describe`s (`with a registered extension route`, `with no extension routes`, `when an extension component throws on render`) and their `it` cases unchanged in behavior; this is a light tidy, not a restructure, since the specific complexity claim for this file didn't hold up under inspection.

## Files to Change

- `frontend/spec/components/ExtensionRoutes_spec.js` — extract repeated setup (fetch stub and/or console spies) into small named helpers to bring the `extension routes integration` describe block under the 50-line guideline (see Step 1).

## CI Checks

- `frontend`: `yarn test` (or `yarn spec` for a faster run without coverage) (CI job: `jasmine-frontend`)
- `frontend`: `yarn lint` (CI job: `checks-frontend`)

## Notes

- Lowest-priority item in this issue: the specific `buildExtensionRoutes` complexity claim is a false positive, and the enclosing describe block is only marginally over 50 lines. If the extraction doesn't meaningfully improve readability, it's acceptable to leave a short explanatory note in the PR rather than force a split that doesn't help scanability.
- No production code under `frontend/src/` changes; only test structure.

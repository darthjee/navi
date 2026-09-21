# Issue: Reduce Codacy duplication in frontend helper specs (loading, error and empty states)

## Description
Codacy reports 18% code duplication for the repository (the project goal is 10%). This issue tackles the frontend helper specs whose `.renderLoading`, `.renderError` and empty-state scenarios are copies of each other: Emissions and Extractions (the main offenders), plus MemoryStatus and Jobs.

Figures below come from Codacy's analysis of `main` at `f25bf98`.

*(Retitled from "Reduce Codacy duplication in Emissions and Extractions helper specs" — scope was widened to cover MemoryStatus and Jobs during refinement.)*

## Problem
| File | Lines | Clones | Duplicated lines |
| --- | ---: | ---: | ---: |
| `frontend/spec/components/EmissionsHelper_spec.js` | 129 | 11 | 114 |
| `frontend/spec/components/ExtractionsHelper_spec.js` | 106 | 12 | 126 |

- `EmissionsHelper_spec.js` and `ExtractionsHelper_spec.js` have identical `.renderLoading` (`renders the loading spinner`) and `.renderError` (`renders the error alert with the prefix`) blocks, and the same empty-state scenarios (`shows the empty state message`, `does not render a table`)
- Both files also hand-roll the same container setup (`beforeEach`/`afterEach` with `createRoot`, mount and unmount) instead of using the existing `useContainer()`/`renderInAct()` from `frontend/spec/support/dom.js`
- `MemoryStatusHelper_spec.js` and `JobsHelper_spec.js` repeat the same `.renderLoading`/`.renderError` scenarios with small variations (both also assert a loading message; `JobsHelper_spec.js` wraps the element in a `MemoryRouter` and hand-rolls its container setup too)

## Expected Behavior
Codacy reports markedly fewer duplication clones for the files above, and behaviour is unchanged (the affected specs still pass and still verify the same scenarios).

## Solution
- Introduce a shared example for `.renderLoading`, `.renderError` and the empty state, parameterised by the helper class and fixtures, and use it from all four specs (Emissions, Extractions, MemoryStatus, Jobs). Its parameters must cover the variations between them: the optional loading message text, the optional error prefix, and an optional render wrapper (the `MemoryRouter` needed by Jobs). The empty-state part applies only to Emissions and Extractions
- Switch `EmissionsHelper_spec.js`, `ExtractionsHelper_spec.js` and `JobsHelper_spec.js` to `useContainer()`/`renderInAct()` from `frontend/spec/support/dom.js` (as `MemoryStatusHelper_spec.js` already does), dropping the hand-rolled setup/teardown
- Note: `frontend/spec/support/` already hosts shared helpers (`dom.js`, `fetch.js`, `fetch_states.js` with `itBehavesLikeFetchStates`), so the new shared example belongs there, following the same `itBehavesLike...` convention
- Out of scope: the scenario-specific duplication inside the specs (e.g. the three repeated badge-class tests in `EmissionsHelper_spec.js`, the headers and 'newest first' checks) — to be revisited after seeing the new Codacy numbers
- Keep every existing assertion and scenario: the refactor must not reduce what the specs verify or change any production code
- Prefer readability over maximal de-duplication; do not introduce abstractions that make a failing spec harder to read
- Owning agent: `frontend` (all changes are under `frontend/spec/`; no new top-level folder)

## Benefits
- Lowers the repository duplication percentage reported by Codacy
- Makes the affected files shorter and easier to extend, so new scenarios need one line instead of a copied block

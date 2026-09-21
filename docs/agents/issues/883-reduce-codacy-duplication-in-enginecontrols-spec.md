# Issue: Reduce Codacy duplication in EngineControls spec

## Description
Codacy reports 18% code duplication for the repository (the project goal is 10%). This issue tackles `EngineControls_spec.js`, which has 18 clones and 178 duplicated lines in 144 lines.

Figures below come from Codacy's analysis of `main` at `f25bf98`; the file has since grown to 179 lines.

## Problem
| File | Lines | Clones | Duplicated lines |
| --- | ---: | ---: | ---: |
| `frontend/spec/components/EngineControls_spec.js` | 144 | 18 | 178 |

- The spec has one `describe` per engine state (running, paused, stopped, transitioning), and each repeats the same `beforeEach` (stub `fetch` with `{ status: '<state>' }`, render, flush) and the same per-button `it` blocks (`renders the X button` / `does not render the X button`), so every state/button pair is written out by hand
- `flushAsync` is defined locally in the spec even though `frontend/spec/support/async.js` already provides one, and `'renders the Engine label'` / `'renders the Shut Down button'` are repeated verbatim across several states

## Expected Behavior
Codacy reports markedly fewer duplication clones for `EngineControls_spec.js`, and behaviour is unchanged (the spec still passes and still verifies the same scenarios, with each button/state pair still reported as its own `it`).

## Solution
- Table-drive the scenarios: for each engine state declare the fetched `status`, which buttons are rendered and which are not, and generate the `describe` / `beforeEach` / `it` blocks from that map (one `it` per state/button pair, keeping the current descriptions such as `renders the Pause button` and `does not render the Start button`)
- Keep the special cases as they are: the transitioning state's spinner check and the fetch-failure `Engine` label check
- Reuse the existing support helpers where they fit (e.g. `flushAsync` from `support/async.js`, `stubFetchSuccess` from `support/fetch.js`) instead of the spec's local copies; `frontend/spec/support/` is also where any new shared helper belongs
- Keep every existing assertion and scenario: the refactor must not reduce what the spec verifies or change any production code
- Prefer readability over maximal de-duplication; do not introduce abstractions that make a failing spec harder to read

## Benefits
- Lowers the repository duplication percentage reported by Codacy
- Makes the spec shorter and easier to extend, so a new engine state or button needs one table entry instead of a copied block

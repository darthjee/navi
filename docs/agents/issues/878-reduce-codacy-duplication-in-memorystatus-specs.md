# Issue: Reduce Codacy duplication in MemoryStatus specs

## Description
Codacy reports 18% code duplication for the repository (the project goal is 10%). This issue tackles the MemoryStatus specs, whose `MemoryStatus_spec.js` alone has 24 clones.

Figures below come from Codacy's analysis of `main` at `f25bf98`.

## Problem
| File | Lines | Clones | Duplicated lines |
| --- | ---: | ---: | ---: |
| `frontend/spec/components/MemoryStatus_spec.js` | 135 | 24 | 217 |
| `frontend/spec/components/MemoryStatusHelper_spec.js` | 81 | 9 | 100 |

- `MemoryStatus_spec.js` repeats a 9-line block four times (71-79, 88-96, 105-113, 122-130) and a 7-line block four times (88-94, 105-111, 122-128, 143-149), plus 50-61 vs 153-164
- `MemoryStatus_spec.js` still hand-writes the "while loading" and "when the fetch fails" scenarios, and defines its own local `flushAsync`, even though `itBehavesLikeFetchStates` (`support/fetch_states.js`) and `flushAsync` (`support/async.js`) already exist and are used by the Jobs, Job, Emissions, Extractions and StatsHeader specs (issue #877)
- `MemoryStatusHelper_spec.js` (9 clones) repeats the same helper-building scenarios: each `.render` scenario repeats the same `beforeEach` that renders the helper output, and `useContainer` from `support/dom.js` is not used (the file hand-rolls the same container/root setup and teardown)

## Expected Behavior
Codacy reports markedly fewer duplication clones for the files above, and behaviour is unchanged (the affected specs still pass and still verify the same scenarios). There is no numeric clone target; the reduction is checked manually against Codacy after the change is merged.

## Solution
- In `MemoryStatus_spec.js`, replace the hand-written "while loading" and "when the fetch fails" blocks with the existing `itBehavesLikeFetchStates({ state, render, loadingText: 'Loading memory status', errorText: 'Failed to load memory status', status: 503 })`, and import `flushAsync` from `support/async.js` instead of the local copy
- Table-drive the per-status scenarios (low / medium / high / over at 100 / over above 100), which vary only by the stubbed payload and the expected color class; keep the "renders the memory usage chart" check for every status, and keep the low-status-only assertions (spinner absent, label, formatted bytes) and the over-limit "does not apply plain over class" assertion
- Keep the generated `describe`/`it` names as close as possible to the current ones (e.g. `with status low`); small wording changes forced by table-driving are acceptable as long as every scenario and assertion remains
- Move the URL-aware `mockFetchSuccessWithHistory` stub (status card gets the payload, `/memory/history.json` gets an empty batch) out of `MemoryStatus_spec.js` into `frontend/spec/support/` (a new file if it does not fit an existing one; do not put it in `fetch.js`, which is shipped verbatim in the navi-hey-test image)
- In `MemoryStatusHelper_spec.js`, adopt `useContainer` from `support/dom.js` in place of the hand-rolled container/root setup, and put the repeated "render helper output inside act()" step in a shared helper under `frontend/spec/support/` (or table-drive the `.render` scenarios where they only differ by input data and expected output)
- Keep every existing assertion and scenario: the refactor must not reduce what the specs verify or change any production code
- Prefer readability over maximal de-duplication; do not introduce abstractions that make a failing spec harder to read

## Benefits
- Lowers the repository duplication percentage reported by Codacy
- Makes the affected files shorter and easier to extend, so new scenarios need one line instead of a copied block
- Brings the MemoryStatus specs in line with the shared fetch-state helpers already adopted by the other page specs

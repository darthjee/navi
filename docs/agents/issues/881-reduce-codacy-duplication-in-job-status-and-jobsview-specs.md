# Issue: Reduce Codacy duplication in Job status and JobsView specs

## Description
Codacy reports 18% code duplication for the repository (the project goal is 10%). This issue tackles the Job status and JobsView specs, led by `Job_status_spec.js` (18 clones, 213 duplicated lines in 203).

Figures below come from Codacy's analysis of `main` at `f25bf98`.

## Problem
| File | Lines | Clones | Duplicated lines |
| --- | ---: | ---: | ---: |
| `frontend/spec/components/Job_status_spec.js` | 203 | 18 | 213 |
| `frontend/spec/components/JobsView_spec.js` | 172 | 6 | 42 |

- `Job_status_spec.js` is already driven by a `statusScenarios` list, but each scenario's `assertions` callback repeats the same shows/does-not-show checks (Remaining attempts, Ready in, Last error, Retry button), e.g. lines 33-45, 63-75, 125-141, 157-169
- `Job_status_spec.js` defines its own `flushAsync` even though `frontend/spec/support/async.js` already exports the same helper (and `Job_spec.js` already imports it)
- `Job_status_spec.js` and `Job_spec.js` each define an identical router `renderJob` helper (`MemoryRouter` + `Routes` wrapping the `Job` page)
- `JobsView_spec.js` contains no rendering setup: it is a pure unit spec of `JobsController` (despite its name). Its duplication comes from repeating the `spyOn(globalThis, 'fetch')` stub, the `setJobs`/`setError`/`setLoading` spy triple, and the `new JobsController('failed', '', navigate)` construction

## Expected Behavior
Codacy reports markedly fewer duplication clones for the files above, and behaviour is unchanged (the affected specs still pass and still verify the same scenarios).

## Solution
- **`Job_status_spec.js` scenarios as data**: each scenario declares a `visible` object with booleans for the sections (remaining attempts, ready in, last error, retry button), and one generic loop generates the "shows / does not show X" specs from it. Scenario-specific checks that do not fit the generic shape (e.g. the "5s" countdown, the collapsed `<details>` error section, the job id, "Ready" when `readyInMs` is 0) stay as small `extraAssertions` callbacks on the scenario
- **Shared helpers**:
  - Delete the local `flushAsync` from `Job_status_spec.js` and import it from `frontend/spec/support/async.js`
  - Move the router `renderJob` into a new `frontend/spec/support/render_job.js` and import it from both `Job_status_spec.js` and `Job_spec.js`
- **`JobsView_spec.js`**:
  - Rename it to `JobsController_spec.js` and move it to `frontend/spec/components/controllers/`, next to the other controller specs, since it tests `JobsController`
  - Extract the repeated fetch stub, the setter-spies factory and the controller-construction helper into `frontend/spec/support/` (reusing `mockFetchSuccess` from `support/fetch.js` where it fits)
- `frontend/spec/support/` already hosts shared helpers (`async.js`, `dom.js`, `fetch.js`), so new helpers belong there
- Keep every existing assertion and scenario: the refactor must not reduce what the specs verify or change any production code
- Prefer readability over maximal de-duplication; do not introduce abstractions that make a failing spec harder to read

## Benefits
- Lowers the repository duplication percentage reported by Codacy
- Makes the affected files shorter and easier to extend, so new scenarios need one line instead of a copied block
- `JobsController`'s spec lives where readers expect it, alongside the other controller specs

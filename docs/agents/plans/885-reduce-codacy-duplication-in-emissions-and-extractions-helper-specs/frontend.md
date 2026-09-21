# Plan: Reduce Codacy duplication in frontend helper specs (loading, error and empty states)

Issue: [885-reduce-codacy-duplication-in-emissions-and-extractions-helper-specs.md](../../issues/885-reduce-codacy-duplication-in-emissions-and-extractions-helper-specs.md)

## Overview
Four helper specs (`EmissionsHelper`, `ExtractionsHelper`, `MemoryStatusHelper`, `JobsHelper`) repeat the same `.renderLoading` and `.renderError` blocks; Emissions and Extractions also repeat the empty-state scenarios, and Emissions, Extractions and Jobs hand-roll the container `beforeEach`/`afterEach` that `useContainer()` already provides. The plan adds shared examples in `frontend/spec/support/helper_states.js` (following the `itBehavesLike...` convention of `support/fetch_states.js`) and migrates the four specs to them, without changing any production code or dropping any assertion.

## Context
- `frontend/spec/support/dom.js` already exports `useContainer()` (returns a `state` with `container`/`root`, wired to `beforeEach`/`afterEach`) and `renderInAct(root, element)`. `MemoryStatusHelper_spec.js` already uses both.
- `EmissionsHelper_spec.js`, `ExtractionsHelper_spec.js` and `JobsHelper_spec.js` still create the container/root by hand.
- Variations between the four specs that the shared example must cover:
  - Loading: all assert `.spinner-border`; MemoryStatus and Jobs also assert a loading text (`Loading memory status`, `Loading jobs`).
  - Error: all assert `.alert-danger` and that the error message appears; Emissions, Extractions and MemoryStatus also assert the prefix (`Failed to load emissions`, `Failed to load extractions`, `Failed to load memory status`); Jobs uses message `HTTP 503` and no prefix.
  - Jobs renders inside a `MemoryRouter` (`createElement(MemoryRouter, { initialEntries: ['/jobs'] }, element)`).
  - Empty state (Emissions, Extractions only): text `No emissions recorded yet.` / `No extractions recorded yet.` and no `table`; the empty render call differs per helper.
- `frontend/spec/support/fetch.js` is shipped verbatim in another image and must not import from `frontend/src`; the new file is a separate support module and takes the helper as a parameter, so it needs no `src` import at all.

## Steps

- [01 — Add the shared helper-state examples](frontend/01-add-shared-helper-state-examples.md)
- [02 — Migrate the Emissions and Extractions specs](frontend/02-migrate-emissions-and-extractions-specs.md)
- [03 — Migrate the MemoryStatus and Jobs specs](frontend/03-migrate-memory-status-and-jobs-specs.md)

## CI Checks
- `frontend`: `npm run spec` for the specs, `npm run lint` (`eslint . && stylelint …`) (CI jobs: `jasmine-frontend`, `checks-frontend`)

## Notes
- Out of scope, per the issue: scenario-specific duplication inside the specs (the three badge-class tests in `EmissionsHelper_spec.js`, the headers and "newest first" checks).
- Spec names may be unified across files (e.g. `renders a spinner` vs `renders the loading spinner`) since they now come from one shared example; every assertion must be preserved.
- Prefer readability over maximal de-duplication: keep the option list of the shared examples small, and keep fixtures and helper-specific `.render` scenarios in each spec.
- Compare the spec counts (`npm run spec`) before and after; the number of passing specs should not drop for the affected files.

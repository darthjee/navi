# Frontend Plan: Reduce Codacy duplication in Menu and Links dropdown specs

Main plan: [plan.md](plan.md)

## Overview
The four specs `MenuDropdown_spec.js`/`LinksDropdown_spec.js` (presentational) and `MenuMenu_spec.js`/`LinksMenu_spec.js` (fetch-driven) are structural twins: same scenarios, differing only in component, label (`Menu`/`Links`), data shape (`entries` with `route` vs `links` with `url`) and the `MemoryRouter` wrapper. `MenuMenu_spec.js` additionally repeats the same fetch-stub + render + flush + open sequence in 5 extension-merging scenarios, and both `*Menu` specs redefine `flushAsync`, which already lives in `support/async.js`.

The fix is spec-only: shared examples in the `itBehavesLike...` style of `support/fetch_states.js` and `support/logs.js` (they take `{ state, render, ... }` and register `describe`/`it` blocks), plus one helper for the extension-merging scaffolding. No `frontend/src/` change and no Codacy config change.

## Context
- Codacy figures (main at `f25bf98`): `MenuMenu_spec.js` 146 duplicated lines / 16 clones, `LinksMenu_spec.js` 97 / 10, `MenuDropdown_spec.js` 64 / 6, `LinksDropdown_spec.js` 59 / 5.
- Existing support helpers to reuse: `useContainer` (`support/dom.js`), `mockFetchSuccess`/`mockFetchFailure` (`support/fetch.js`), `flushAsync` (`support/async.js`).
- Constraint: every existing assertion and scenario must still run; readability wins over maximal de-duplication.

## Steps

- [01 — Shared dropdown example](frontend/01-shared-dropdown-example.md)
- [02 — Shared fetched-menu example](frontend/02-shared-fetched-menu-example.md)
- [03 — Extension-merging helper](frontend/03-extension-merging-helper.md)
- [04 — Verify](frontend/04-verify.md)

## CI Checks
- `frontend`: `cd frontend && npm run lint` (CI job: `checks-frontend`)
- `frontend`: `cd frontend && npm test` (CI job: `jasmine-frontend`)

## Notes
- Steps 02 and 03 both touch `support/fetched_menu.js`; do 02 first, then 03.
- `MenuMenu_spec.js` calls `spyOn(console, 'warn')` in its failure scenarios and `resetExtensionsCache()` in an outer `beforeEach`; both must stay effective after refactoring (the outer `beforeEach` runs before shared-example blocks, so it can stay in the spec).
- Codacy's post-merge figures are the real acceptance measure; locally, compare line counts and confirm the spec count (`npm test` "N specs") does not drop.

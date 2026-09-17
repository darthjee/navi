# dev Plan: Empty arrow-function stubs flagged by no-empty-function

Main plan: [plan.md](plan.md)

## Shared contracts

Register the stub plugin exactly as described in the main plan (key `@typescript-eslint`, rule `no-empty-function`, no-op implementation), and give the new `spec/support/noop.js` the same disable-comment convention used in `frontend/src/utils/noop.js` — same rule id, same "intentional no-op" justification wording.

## Implementation Steps

### Step 1 — Register the `@typescript-eslint/no-empty-function` stub rule
In `dev/frontend/eslint.config.mjs`, add the same stub plugin as `frontend/eslint.config.mjs` Step 1: a plugin registered under key `@typescript-eslint` with a no-op `no-empty-function` rule, wired into the existing `plugins` map of the main config block.

### Step 2 — Add a shared `noop` spec helper and use it in place of inline empty arrow functions
Create `dev/frontend/spec/support/noop.js`, mirroring `frontend/src/utils/noop.js`: the same block-comment justification, a `// eslint-disable-next-line @typescript-eslint/no-empty-function` above `const noop = () => {};`, and a default export. `dev/frontend` is a separate package with no existing shared `utils/` and no cross-package import from `frontend/src`, so this is a new file, not a re-export.

Then, in each of the 4 flagged spec files, import `noop` from `../support/noop.js` (or the correct relative path per file) and replace `spyOn(globalThis, 'fetch').and.returnValue(new Promise(() => {}))` with `spyOn(globalThis, 'fetch').and.returnValue(new Promise(noop))`:
- `dev/frontend/spec/pages/CategoriesIndexPage_spec.js`
- `dev/frontend/spec/pages/CategoryItemPage_spec.js`
- `dev/frontend/spec/pages/CategoryItemsIndexPage_spec.js`
- `dev/frontend/spec/pages/CategoryPage_spec.js`

## Files to Change
- `dev/frontend/eslint.config.mjs` — add the `@typescript-eslint` stub plugin (rule `no-empty-function`, no-op `create`), registered in the `plugins` map.
- `dev/frontend/spec/support/noop.js` — new file, mirroring `frontend/src/utils/noop.js`.
- `dev/frontend/spec/pages/CategoriesIndexPage_spec.js` — import `noop`, use `new Promise(noop)`.
- `dev/frontend/spec/pages/CategoryItemPage_spec.js` — import `noop`, use `new Promise(noop)`.
- `dev/frontend/spec/pages/CategoryItemsIndexPage_spec.js` — import `noop`, use `new Promise(noop)`.
- `dev/frontend/spec/pages/CategoryPage_spec.js` — import `noop`, use `new Promise(noop)`.

## CI Checks
- `dev/frontend`: `npm run lint` (CI job: `checks-dev-frontend`)
- `dev/frontend`: `npm test` (CI job: `jasmine-dev-frontend`) — confirms the pending-promise/spinner tests still pass after swapping in `noop`.

## Notes
- `.codacy.yaml`'s `exclude_paths` now correctly excludes `dev/frontend/spec/` (the `excluded_paths`→`exclude_paths` key typo was fixed on `main` in issue #847/PR #862), so Codacy should stop scanning these spec files at all going forward. This change is made anyway for local lint cleanliness and to remove the inline empty-function pattern, not because Codacy will keep flagging it.
- Do not enable the stub rule — same reasoning as in `frontend.md`.

# Issue: Empty arrow-function stubs flagged by no-empty-function

## Description
Codacy's ESLint analysis (pattern `ESLint8_@typescript-eslint_no-empty-function`) flagged 6 empty arrow functions across the codebase:

- `frontend/src/utils/noop.js:5`
- `dev/frontend/spec/pages/CategoriesIndexPage_spec.js:41`
- `dev/frontend/spec/pages/CategoryItemPage_spec.js:38`
- `dev/frontend/spec/pages/CategoryItemsIndexPage_spec.js:47`
- `dev/frontend/spec/pages/CategoryPage_spec.js:38`

## Problem
- `frontend/src/utils/noop.js` is a deliberate no-op helper (already documented with a block comment), but nothing suppresses the lint rule, so Codacy keeps reporting it as a false positive.
- The 4 flagged spec files all use the exact same pattern: `spyOn(globalThis, 'fetch').and.returnValue(new Promise(() => {}))` inside a `beforeEach`, to keep the fetch call permanently pending so the component stays in its loading state for a "shows a spinner" test. This is an intentional, deliberate mock — not a leftover stub or incomplete test.
- Investigation found that `.codacy.yaml`'s `exclude_paths` already lists `dev/frontend/spec/`, and the key typo that silently disabled this exclusion (`excluded_paths` instead of `exclude_paths`) was just fixed on `main` (issue #847, PR #862). Once Codacy re-analyzes with the corrected key, the 4 spec-file findings should stop recurring from Codacy's side. `frontend/src/` is not excluded, so `noop.js` remains genuinely in scope regardless. Even so, the underlying pattern (an inline empty arrow function per spec file) is worth cleaning up directly rather than relying solely on the exclusion.
- Codacy's pattern name (`@typescript-eslint/no-empty-function`) is not a rule either `frontend` or `dev/frontend` actually registers locally (neither uses `@typescript-eslint`). This repo already has an established convention for this exact mismatch: `frontend/eslint.config.mjs` registers no-op stub plugins (`no-unsanitized`, `security`) purely so a `// eslint-disable-next-line <rule>` comment aimed at Codacy's scanner doesn't trip ESLint's flat-config "disable comment for unregistered rule" hard error locally. The same approach applies here.

## Expected Behavior
- `noop.js` no longer shows as an unaddressed lint finding — its intentional emptiness is explicit to both the linter and human readers.
- The 4 spec files no longer contain inline empty arrow functions; they reuse a single, explicitly-justified no-op helper instead.
- Local `eslint` runs (in both `frontend` and `dev/frontend`) continue to pass cleanly despite the new disable comments.

## Solution
1. In `frontend/eslint.config.mjs`, add a stub plugin registering `@typescript-eslint/no-empty-function` as a known-but-unimplemented rule, following the exact pattern already used there for `noUnsanitizedStub` and `securityStub`.
2. In `frontend/src/utils/noop.js`, add `// eslint-disable-next-line @typescript-eslint/no-empty-function` with a short note that the emptiness is intentional.
3. Create `dev/frontend/spec/support/noop.js`, mirroring `frontend/src/utils/noop.js` (same disable comment and justification), since `dev/frontend` is a separate package with no existing shared `utils` and cannot import across packages from `frontend/src`.
4. In `dev/frontend/eslint.config.mjs`, add the equivalent stub plugin so the new disable comment in `dev/frontend/spec/support/noop.js` doesn't error locally.
5. In the 4 affected spec files (`CategoriesIndexPage_spec.js`, `CategoryItemPage_spec.js`, `CategoryItemsIndexPage_spec.js`, `CategoryPage_spec.js`), import the new helper and replace `new Promise(() => {})` with `new Promise(noop)`. This removes the inline empty arrow function from each spec file, leaving a single, well-documented empty-function definition per package instead of four.

## Benefits
- Removes a recurring false-positive from Codacy's findings for `noop.js`, and prevents the same pattern from reappearing across spec files.
- Centralizes the "intentionally empty" justification in one place per package instead of repeating it (or an inline empty function) in every test that needs a permanently-pending promise.
- Keeps local `eslint` and Codacy's hosted analysis in agreement, following this repo's existing stub-plugin convention for scanner-only rules.

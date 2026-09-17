# Plan: Empty arrow-function stubs flagged by no-empty-function

Issue: [848-empty-arrow-function-stubs-flagged-by-no-empty-function.md](../../issues/848-empty-arrow-function-stubs-flagged-by-no-empty-function.md)

## Overview
Silence Codacy's `@typescript-eslint/no-empty-function` false positives on two genuinely-intentional empty functions. `frontend` registers a stub plugin so a scoped disable comment can suppress the finding on its existing `noop.js` helper. `dev` does the same in its own package, additionally introducing an equivalent `spec/support/noop.js` helper that the 4 flagged spec files import instead of each inlining its own empty arrow function.

## Agents involved

- [frontend](frontend.md)
- [dev](dev.md)

## Shared contracts

Both packages are independent (no cross-package imports), but must apply the **same convention** for consistency and so a future reviewer recognizes the pattern in either place:

- **Stub plugin shape** (mirrors the existing `noUnsanitizedStub`/`securityStub` pattern in `frontend/eslint.config.mjs`): a plugin object registered under key `@typescript-eslint` with a single rule `no-empty-function` implemented as a no-op (`{ create: () => ({}) }`). This exists purely so ESLint's flat config doesn't hard-error on a disable comment referencing an unregistered rule; the rule itself is never enabled.
- **Disable comment**: `// eslint-disable-next-line @typescript-eslint/no-empty-function` placed directly above the empty function, each followed by a short comment explaining the emptiness is intentional (already present as a block comment on `frontend/src/utils/noop.js`; `dev`'s new `noop.js` should carry the same wording).

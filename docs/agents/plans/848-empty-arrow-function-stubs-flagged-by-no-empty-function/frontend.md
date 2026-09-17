# frontend Plan: Empty arrow-function stubs flagged by no-empty-function

Main plan: [plan.md](plan.md)

## Shared contracts

Register the stub plugin exactly as described in the main plan (key `@typescript-eslint`, rule `no-empty-function`, no-op implementation), and suppress the finding on `noop.js` with the disable-comment convention shared with `dev`.

## Implementation Steps

### Step 1 — Register the `@typescript-eslint/no-empty-function` stub rule
In `frontend/eslint.config.mjs`, add a stub plugin next to the existing `noUnsanitizedStub`/`securityStub` (same file, same pattern, same explanatory comment style) that registers `no-empty-function` as a known-but-unimplemented rule under plugin key `@typescript-eslint`. Wire it into the `plugins` map of the main JS/JSX config block alongside `no-unsanitized` and `security`.

### Step 2 — Suppress the finding on `noop.js`
In `frontend/src/utils/noop.js`, add `// eslint-disable-next-line @typescript-eslint/no-empty-function` immediately above `const noop = () => {};`. The existing block comment above it already explains the helper is intentional; no need to duplicate that explanation inline.

## Files to Change
- `frontend/eslint.config.mjs` — add the `@typescript-eslint` stub plugin (rule `no-empty-function`, no-op `create`), registered in the `plugins` map.
- `frontend/src/utils/noop.js` — add the scoped disable comment above the empty arrow function.

## CI Checks
- `frontend`: `npm run lint` (CI job: `checks-frontend`)

## Notes
- Do not enable the stub rule — it exists only so the disable comment doesn't trigger ESLint's flat-config "disable comment for unregistered rule" error locally; Codacy's own hosted scanner is what actually evaluates `@typescript-eslint/no-empty-function`.

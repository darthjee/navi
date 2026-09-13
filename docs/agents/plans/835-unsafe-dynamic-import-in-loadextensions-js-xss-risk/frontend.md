# frontend Plan: Unsafe dynamic import() in loadExtensions.js (XSS risk)

Main plan: [plan.md](plan.md)

## Implementation Steps

### Step 1 — Document the invariant and suppress the finding
In `frontend/src/extensions/loadExtensions.js`, immediately above the `mod = await import(/* @vite-ignore */ bundle.src);` line (inside `loadBundleDescriptors`):

1. Add a comment recording the invariant: `bundle.src` is always built server-side by `FrontendManifestHandler` (`source/lib/server/handlers/FrontendManifestHandler.js`) from a `fs.readdirSync()` listing of the deployer-mounted `<NAVI_EXTENSIONS_DIR>/frontend/` folder (`source/lib/server/extensions/ExtensionsEnv.js`) — never from request query/body/header input — so it is not attacker-controllable through any HTTP surface this app exposes.
2. Add `// eslint-disable-next-line no-unsanitized/method` directly above the `import()` call. This rule isn't registered in `frontend/eslint.config.mjs`, so the comment is a no-op for the repo's own local `npm run lint`, but ESLint disable comments are honored by Codacy's own ESLint-based scan (which runs its own rule set independent of the repo's config), so it suppresses the flagged finding there.

No runtime/behavior change — this is a documentation + suppression change only.

## Files to Change
- `frontend/src/extensions/loadExtensions.js` — add the invariant comment and `eslint-disable-next-line no-unsanitized/method` above the `import()` call at line 52.

## CI Checks
- `frontend`: `npm run lint` (CI job: `checks-frontend`)
- `frontend`: `npm test` (CI job: `jasmine-frontend`) — no behavior change expected, existing `loadExtensions` spec coverage should still pass unmodified.

## Notes
- This does not change `loadBundleDescriptors`'s behavior or add runtime validation — the user explicitly chose "document invariant + suppress finding" over adding defense-in-depth validation, since `bundle.src` is already fully server-controlled.
- If Codacy's inline ESLint-disable comment turns out not to be honored by its scan (some Codacy setups only respect rule suppression configured in the Codacy UI/dashboard rather than inline comments), the fallback is to suppress the specific finding for this file/line via the Codacy dashboard instead — this is outside the repo and not something a code change can guarantee, so verify after the next Codacy scan runs on the PR.

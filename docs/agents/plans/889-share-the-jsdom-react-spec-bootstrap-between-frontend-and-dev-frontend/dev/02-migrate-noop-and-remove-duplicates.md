# Migrate noop imports and remove the duplicated support files
Switch the 6 dev specs that import `support/noop.js` to `navi-spec-support/noop.js`, then delete the now-duplicated `dev/frontend/spec/support/{dom,loader,transform_hooks,noop}.js` and the leftover `dev/frontend/spec/support/jasmine.json` (unused; the config lives inline in `package.json`). Remove the `typescriptEslintStub` plugin and its `@typescript-eslint` registration from `dev/frontend/eslint.config.mjs`: it existed only for the disable comment in `noop.js`, which now lives in `spec-support/`. Re-run `yarn lint` to make sure nothing else referenced it.

## Files to Change
- `dev/frontend/spec/**/*_spec.js` — the 6 specs importing `noop`
- `dev/frontend/spec/support/{dom,loader,transform_hooks,noop,jasmine}.js(on)` — deleted
- `dev/frontend/eslint.config.mjs` — drop the `@typescript-eslint` stub

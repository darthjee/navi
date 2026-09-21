# Create the spec-support package
Create the new root-level `spec-support/` folder as a private package, moving the shared bootstrap out of the two frontends verbatim, so `frontend`, `dev` and `docker` can consume it. Preserve git history where possible (`git mv` from `frontend/spec/support/` for `dom.js`, `async.js`, `loader.js`, `transform_hooks.js`; `noop.js` from `dev/frontend/spec/support/`).

- `dom.js`: start from `frontend/spec/support/dom.js` (keeps `useContainer` and `renderInAct`) and add the `navigator: window.navigator` and `location: window.location` globals from `dev/frontend/spec/support/dom.js`.
- `loader.js` and `transform_hooks.js`: unchanged; they must stay in the same folder since `loader.js` resolves the hooks via `import.meta.url`.
- `async.js`: unchanged (`flushAsync`, `flushMany`).
- `noop.js`: unchanged, including the `@typescript-eslint/no-empty-function` disable comment.
- `package.json`: `name: navi-spec-support`, `private: true`, `type: module`, `version` (e.g. `1.0.0`), a short description, the `exports` map from the shared contract, and `peerDependencies` for `jsdom`, `react`, `react-dom` and `esbuild` only (no `dependencies`, no publish scripts).
- Add a short `README.md` (internal, not npm-facing) describing what the package is and the reinstall-after-edit rule.

Do not delete the originals in `frontend/` and `dev/frontend/` here beyond what `git mv` implies; the `frontend` and `dev` agents migrate their own imports and remove the leftovers. (If `git mv` would leave the frontend broken between steps, copy instead and let those agents delete.)

## Files to Change
- `spec-support/package.json` — new private package definition
- `spec-support/README.md` — internal description
- `spec-support/dom.js` — from `frontend/spec/support/dom.js` plus `navigator`/`location`
- `spec-support/loader.js`, `spec-support/transform_hooks.js` — moved verbatim
- `spec-support/async.js` — moved from `frontend/spec/support/async.js`
- `spec-support/noop.js` — moved from `dev/frontend/spec/support/noop.js`

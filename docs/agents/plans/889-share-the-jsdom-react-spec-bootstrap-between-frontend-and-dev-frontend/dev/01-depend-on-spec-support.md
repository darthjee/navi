# Depend on navi-spec-support and rewire the test scripts
In `dev/frontend/package.json` add `"navi-spec-support": "file:../../spec-support"` to `devDependencies` (two levels up, since `dev/frontend/` is nested under `dev/`); change the `test` and `coverage` scripts to `--import navi-spec-support/loader.js`; change `jasmine.helpers` to load `navi-spec-support/dom.js` (or a one-line `spec/support/setup.js` if Jasmine cannot glob into `node_modules`). Run `yarn install` (with `../../spec-support` reachable) to refresh `yarn.lock`. Confirm `c8` does not pick up `node_modules/navi-spec-support` (`include` is `src/**`, so no change is expected).

Note the esbuild range mismatch (`^0.24` here vs `^0.28` in `frontend/`): the shared package declares esbuild only as a peer dependency, so each package keeps its own; align them only if the peer range requires it.

## Files to Change
- `dev/frontend/package.json` — devDependency, scripts, jasmine helpers
- `dev/frontend/yarn.lock` — lockfile refresh

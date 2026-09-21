# Frontend Plan: Share the jsdom/React spec bootstrap between frontend and dev/frontend

Main plan: [plan.md](plan.md)

## Shared contracts

Relies on `spec-support/` (`navi-spec-support`) existing with the exports listed in [plan.md](plan.md#shared-contracts): `dom.js` (`useContainer`, `renderInAct`), `loader.js`, `transform_hooks.js`, `async.js` (`flushAsync`, `flushMany`). The `frontend` agent consumes them and does not own them.

## Implementation Steps

### Step 1 — Depend on navi-spec-support and rewire the test scripts
In `frontend/package.json` add `"navi-spec-support": "file:../spec-support"` to `devDependencies`; change the `spec`, `test` and `coverage` scripts to `--import navi-spec-support/loader.js`; change `jasmine.helpers` to load `navi-spec-support/dom.js` (or a one-line `spec/support/setup.js` if Jasmine cannot glob into `node_modules`). Run `yarn install` (with the folder available) to refresh `yarn.lock`; `frontend/package-lock.json` is also tracked — update it consistently (or confirm with the maintainers whether it is still used). Check `c8` config: `include` is `src/**`, so no change is expected, but confirm coverage does not pick up `node_modules/navi-spec-support`.

### Step 2 — Migrate imports and remove the moved files
Replace every relative import of the moved helpers with the package specifiers: 23 files import `support/dom.js` and 15 import `support/async.js` under `frontend/spec/`, plus the support files that stay (`helper_states.js`, `logs.js`, `fetch_states.js`, `fetched_menu.js`, `polling_controller.js`). Delete `frontend/spec/support/{dom,async,loader,transform_hooks}.js` (if not already moved by the architect). Support files that import from `frontend/src/` (`fetch_states`, `logs`, `polling_controller`, `render_job`, ...) stay put. Local `flushAsync` redefinitions in `ReadyCountdown_spec`, `MemoryUsageChart_spec`, `ExtensionRoutes_spec` and `Layout_spec` are identical to the shared one and may switch to it; leave `LogsPageView_spec` alone (its variant has no `act`). Keep specs verifying exactly what they verified before.

## Files to Change
- `frontend/package.json` — devDependency, scripts, jasmine helpers
- `frontend/yarn.lock`, `frontend/package-lock.json` — lockfile refresh
- `frontend/spec/**/*_spec.js` — import paths (23 for `dom`, 15 for `async`)
- `frontend/spec/support/{helper_states,logs,fetch_states,fetched_menu,polling_controller}.js` — import paths
- `frontend/spec/support/{dom,async,loader,transform_hooks}.js` — deleted (moved to `spec-support/`)

## CI Checks
- `frontend`: `yarn install && yarn coverage` (CI job: `jasmine-frontend`)
- `frontend`: `yarn lint` (CI job: `checks-frontend`)

## Notes
- After pulling, developers need a one-time `yarn install` in `frontend/` (in Docker, inside the `navi_frontend` container with the new mount, after the `docker` agent's compose change).
- Verify that `--import navi-spec-support/loader.js` resolves from the working directory both via the npm script and via `NODE_OPTIONS`, and that the shared `dom.js` is a single module instance whether loaded as a Jasmine helper or imported by a spec.
- CI runs `checkout` then `yarn install`, so the `file:` dependency needs no new CI step; confirm `--frozen-lockfile` (if used) accepts the `file:` entry.

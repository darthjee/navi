# Spec Support

## Overview

`spec-support/` is `navi-spec-support`: a private npm package (`"private": true`, never published, no release flow) that holds the single copy of the jsdom/React test bootstrap used by the Jasmine suites of both frontends, `frontend/` and `dev/frontend/`. Before it existed, the two suites carried near-identical copies of `dom.js`, `loader.js` and `transform_hooks.js`, and `dev/frontend/` re-implemented by hand what `frontend/`'s `useContainer` already provided.

It is owned by the `spec-support` agent (`.claude/agents/spec-support.md`).

## Package contract

`spec-support/package.json` exposes only these subpaths (`exports` map):

| Specifier | File | Exports |
|-----------|------|---------|
| `navi-spec-support/dom.js` | `spec-support/dom.js` | Installs the jsdom globals (including `navigator` and `location`) as a side effect; named exports `useContainer` and `renderInAct` |
| `navi-spec-support/loader.js` | `spec-support/loader.js` | Side effect: registers `./transform_hooks.js` via `import.meta.url` |
| `navi-spec-support/transform_hooks.js` | `spec-support/transform_hooks.js` | ESM `load` hook: transforms `.jsx` through esbuild (automatic JSX runtime) and stubs css/scss/sass/less imports |
| `navi-spec-support/async.js` | `spec-support/async.js` | Named exports `flushAsync` and `flushMany` |
| `navi-spec-support/fetch.js` | `spec-support/fetch.js` | Named exports `stubFetchSuccess`, `mockFetchSuccess`, `mockFetchFailure`, `mockFetchPending` and `paginationHeaders` |
| `navi-spec-support/noop.js` | `spec-support/noop.js` | Default export `noop` |

- `useContainer()` — call at `describe` level; registers `beforeEach`/`afterEach` that create a DOM container, a React `createRoot` and unmount them, returning a state object exposing `container` and `root`.
- `renderInAct(root, element)` — renders inside an `act()` boundary.
- `flushAsync()` / `flushMany(times)` — let pending promises and timers settle inside `act()`.
- `stubFetchSuccess(data, headers?)` — call inside `it`/`beforeEach`; `spyOn(globalThis, 'fetch')` resolving a successful JSON response (with `headers` on the response when given).
- `mockFetchSuccess(data, headers?)`, `mockFetchFailure(status)`, `mockFetchPending()` — call at `describe` level; register a `beforeEach` that stubs `fetch` with a success, a failure (`{ ok: false, status }`) or a never-resolving promise (loading state).
- `paginationHeaders({ page, pageSize, pages })` — builds the `PAGE` / `PAGE-SIZE` / `PAGES` `Headers` read by `responseHandler`.

The package has no runtime dependencies. `jsdom`, `react`, `react-dom` and `esbuild` are `peerDependencies` only, so each frontend controls its own versions and there is a single React instance shared with the app under test.

Support files that import from `frontend/src/` (`fetch_states`, `logs`, `polling_controller`, `render_job`, ...) are not part of the package; they stay in `frontend/spec/support/`.

## How the frontends consume it

Both declare a `file:` devDependency, the same pattern `source/` uses for `deku-swarm` (no npm workspaces):

| Consumer | `package.json` entry |
|----------|----------------------|
| `frontend/` | `"navi-spec-support": "file:../spec-support"` |
| `dev/frontend/` | `"navi-spec-support": "file:../../spec-support"` |

The loader is registered with `--import navi-spec-support/loader.js` in the `spec`/`test`/`coverage` scripts, the Jasmine `helpers` load `navi-spec-support/dom.js`, and specs import helpers by package specifier, never by relative path.

**Reinstall after editing.** Yarn v1 copies `file:` dependencies into `node_modules`, so consumers hold a snapshot. After changing anything in `spec-support/`, re-run `yarn install` in each consumer before running its specs.

### Docker Compose

`docker-compose.yml` mounts the folder so that `yarn install` can resolve the `file:` path (specs read from `node_modules` at test time, so the mount is only needed at install time):

| Service | Mount |
|---------|-------|
| `navi_frontend` | `./spec-support:/home/node/spec-support` |
| `navi_dev_frontend` | `./spec-support:/home/spec-support` |

### CI

No dedicated job. `jasmine-frontend` and `jasmine-dev-frontend` check out the repository and run `yarn install`, which copies the folder from disk. The folder is excluded from Codacy analysis (`.codacy.yaml`) like the other spec trees and has no lint job of its own.

## `navi-hey-test` image

`dockerfiles/navi-hey-test/` reuses `dom.js`, `loader.js` and `transform_hooks.js` from `spec-support/` (and `fetch.js` from `frontend/spec/support/`), baking them into the image so extension authors can `import { useContainer } from 'navi-hey/testing/dom.js'`. That downstream contract (`navi-hey/testing/dom.js` and `navi-hey/testing/fetch.js`) does not change; see [extending Navi](../guides/navi/extending-navi.md).

## Related

- [Frontend](frontend.md) — the dashboard SPA and its specs
- [Dev Application](dev-app.md) — `dev/frontend/`
- [Folder Structure](folder-structure.md)

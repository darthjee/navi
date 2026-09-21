# navi-spec-support

Internal, private (never published) package holding the jsdom/React spec
bootstrap shared by the `frontend/` and `dev/frontend/` test suites.

| Specifier | Purpose |
| --- | --- |
| `navi-spec-support/dom.js` | Installs the jsdom globals; exports `useContainer` and `renderInAct` |
| `navi-spec-support/loader.js` | Registers the ESM transform hooks (`--import`) |
| `navi-spec-support/transform_hooks.js` | ESM `load` hook: JSX via esbuild, stubs css/scss/sass/less |
| `navi-spec-support/async.js` | `flushAsync` and `flushMany` |
| `navi-spec-support/fetch.js` | Fetch stubs (`stubFetchSuccess`, `mockFetchSuccess`, `mockFetchFailure`, `mockFetchPending`) and `paginationHeaders` |
| `navi-spec-support/noop.js` | Default-exported `noop` function |

`jsdom`, `react`, `react-dom` and `esbuild` are peer dependencies only: each
consumer provides its own copy, so there is a single React instance.

## Consuming

Each frontend declares `"navi-spec-support": "file:<relative path>"` in its
`devDependencies` (`file:../spec-support` in `frontend/`,
`file:../../spec-support` in `dev/frontend/`).

Yarn v1 copies `file:` dependencies into `node_modules`, so consumers hold a
snapshot: **after editing anything in this folder, re-run `yarn install` in
each consumer** (`frontend/` and `dev/frontend/`).

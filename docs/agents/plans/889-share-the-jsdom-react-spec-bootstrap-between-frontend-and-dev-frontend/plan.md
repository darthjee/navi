# Plan: Share the jsdom/React spec bootstrap between frontend and dev/frontend

Issue: [889-share-the-jsdom-react-spec-bootstrap-between-frontend-and-dev-frontend.md](../../issues/889-share-the-jsdom-react-spec-bootstrap-between-frontend-and-dev-frontend.md)

## Overview
Extract the duplicated jsdom/React spec bootstrap into one private, never-published package, `navi-spec-support`, living in a new root-level `spec-support/` folder. Both `frontend/` and `dev/frontend/` consume it through `file:` dependencies (same pattern as `deku-swarm`), with `jsdom`, `react`, `react-dom` and `esbuild` as peer dependencies only. A new dedicated `spec-support` agent owns the folder. The `navi-hey-test` image, compose mounts, `.codacy.yaml` and the docs are updated to match.

## Agents involved

- [architect](architect.md) — creates `spec-support/` (must land first), the new `spec-support` agent, root-level config and docs
- [frontend](frontend.md) — consumes the package from `frontend/` and removes the moved files
- [dev](dev.md) — consumes the package from `dev/frontend/`, removes the duplicates and adopts the shared helpers
- [docker](docker.md) — compose mounts and the `navi-hey-test` image

## Shared contracts

**Package** — `spec-support/`, name `navi-spec-support`, `"private": true`, `"type": "module"`, no runtime dependencies, `peerDependencies` only: `jsdom`, `react`, `react-dom`, `esbuild` (ranges compatible with `^25`, `^19.2`, `^19.2`, and the consumers' esbuild ranges). `exports` map (no other subpaths are public):

| Specifier | File | Exports |
| --- | --- | --- |
| `navi-spec-support/dom.js` | `spec-support/dom.js` | installs the jsdom globals (including `navigator` and `location`) as a side effect; named exports `useContainer`, `renderInAct` |
| `navi-spec-support/loader.js` | `spec-support/loader.js` | side effect: registers `./transform_hooks.js` via `import.meta.url` |
| `navi-spec-support/transform_hooks.js` | `spec-support/transform_hooks.js` | ESM `load` hook (JSX via esbuild, stubs css/scss/sass/less) |
| `navi-spec-support/async.js` | `spec-support/async.js` | named exports `flushAsync`, `flushMany` |
| `navi-spec-support/noop.js` | `spec-support/noop.js` | default export `noop` |

The contents of these files are moved verbatim from `frontend/spec/support/` (`dom.js` gains `navigator` and `location` from `dev/frontend/spec/support/dom.js`; `noop.js` comes from `dev/frontend/spec/support/`).

**Consumption**
- `frontend/package.json` devDependency: `"navi-spec-support": "file:../spec-support"`; `dev/frontend/package.json` devDependency: `"navi-spec-support": "file:../../spec-support"`.
- Loader registration: `--import navi-spec-support/loader.js` (replaces `--import ./spec/support/loader.js`) in the `spec`/`test`/`coverage` scripts.
- Jasmine `helpers` load `navi-spec-support/dom.js` (replaces `support/dom.js`); if Jasmine cannot glob into `node_modules` from `spec_dir`, use a one-line local `spec/support/setup.js` that imports it.
- Specs import helpers from the package specifiers above, never by relative path.

**Compose mounts** (needed only so `yarn install` can find the folder; specs resolve from `node_modules` at test time):
- `navi_frontend`: `./spec-support:/home/node/spec-support`
- `navi_dev_frontend`: `./spec-support:/home/spec-support`

**Downstream contract that must not change:** the `navi-hey-test` image keeps exposing `navi-hey/testing/dom.js` (with `useContainer`) and `navi-hey/testing/fetch.js`; `docs/guides/navi/extending-navi.md` and `examples/navi-orders-extension/` keep working unchanged.

## Ordering
1. `architect` step 01 (create `spec-support/`) first.
2. `frontend`, `dev` and `docker` can then proceed independently.
3. `architect` steps 02 and 03 (agent definition, config, docs) can run at any point.

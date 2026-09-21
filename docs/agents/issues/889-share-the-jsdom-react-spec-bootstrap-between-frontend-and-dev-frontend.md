# Issue: Share the jsdom/React spec bootstrap between frontend and dev/frontend

## Description
`frontend/` (the Navi dashboard) and `dev/frontend/` (the dev-only app) each have their own test bootstrap under `spec/support/`. Two files are byte-for-byte identical, a third has drifted, and the drift has a visible cost: the dev frontend specs re-implement by hand what `frontend/spec/support/dom.js` already provides, which likely accounts for a good share of the duplication Codacy reports for the dev frontend specs.

This issue extracts the bootstrap into one shared, private (never published) package consumed by both frontends.

## Problem
Files compared: `frontend/spec/support/` vs `dev/frontend/spec/support/`.

| File | frontend | dev/frontend | Difference |
| --- | ---: | ---: | --- |
| `loader.js` | 3 lines | 3 lines | identical |
| `transform_hooks.js` | 31 lines | 31 lines | identical |
| `dom.js` | 54 lines | 33 lines | frontend's exports a React `useContainer()` helper (container + `createRoot` + unmount in `beforeEach`/`afterEach`) and `renderInAct()`; dev/frontend's has neither but declares two extra jsdom globals (`navigator`, `location`) |
| `noop.js` | - | present | dev/frontend only (used by 6 dev specs); the frontend uses `frontend/src/utils/noop.js`, which is app code |

Because `dev/frontend` has no `useContainer`, the dev page specs each hand-roll the same setup: `createRoot`, `document.createElement('div')`, `beforeEach`/`afterEach` mount and unmount, plus a locally redefined `flushAsync` (`frontend/spec/support/async.js` already exports `flushAsync` and `flushMany`). Six dev frontend specs use `createRoot` directly: `Pagination_spec.js`, `IndexPage_spec.js`, `CategoriesIndexPage_spec.js`, `CategoryPage_spec.js`, `CategoryItemPage_spec.js`, `CategoryItemsIndexPage_spec.js`; six redefine `flushAsync` locally: `PaginatedList_spec`, `useFetchData_spec` and the four `Category*Page` specs. Codacy (`main` at `f25bf98`) reports 14-15 clones each for the four `Category*Page` specs.

Constraints found while investigating:

- There is no root `package.json`/`node_modules`, so shared files living outside both packages would have nowhere to resolve `jsdom`, `react`, `react-dom` or `esbuild` from.
- `dev/frontend` must not import from `frontend/` by relative path: the `navi_dev_frontend` container only mounts `./dev/frontend`, and the two packages sit at different depths (`frontend/` and `dev/frontend/`).
- `react`/`react-dom` must remain a single instance shared with the app under test.
- `dockerfiles/navi-hey-test/*` copies `frontend/spec/support/{dom,fetch,loader,transform_hooks}.js` verbatim, so moving them breaks that image unless it is updated.

This overlaps with #887 (Reduce Codacy duplication in dev frontend page and client specs). #887 already defers the bootstrap to this issue; #889 lands first so #887 can rewrite the dev page specs on top of `useContainer`.

## Expected Behavior
One copy of the jsdom globals, the ESM loader/transform hooks, the React container helper and the shared async/noop helpers, used by both `frontend/` and `dev/frontend/` specs, with all existing specs unchanged in what they verify.

## Solution
Decided approach: a **private shared package** (`"private": true`, never published, no npm release flow), consumed through `file:` dependencies like `deku-swarm` — no npm workspaces.

**Package**
- Location/name: root-level `spec-support/`, package `navi-spec-support`.
- Contents: `dom.js` (with `useContainer`, `renderInAct`, and the `navigator`/`location` globals), `loader.js`, `transform_hooks.js` (kept together, since `loader.js` resolves the hooks via `import.meta.url`), `flushAsync`/`flushMany` (from `async.js`) and `noop`.
- Support files that import from `frontend/src/` (`fetch_states`, `logs`, `polling_controller`, `render_job`, ...) stay in `frontend/spec/support/`.
- `jsdom`, `react`, `react-dom` and `esbuild` are declared only as `peerDependencies`, so each frontend keeps control of its own versions and there is a single React instance. Whether to align the esbuild versions (`^0.28` in `frontend/`, `^0.24` in `dev/frontend/`) is left to the plan.
- Scope is the two frontends only; it is not (yet) a broader shared spec-support package.

**How it is consumed**
- Both frontends declare `"navi-spec-support": "file:<relative path>"` in `devDependencies` (`file:../spec-support` in `frontend/`, `file:../../spec-support` in `dev/frontend/`, since the depths differ).
- Yarn v1 copies the package into `node_modules`, so it is a snapshot: edits to the shared folder require re-running `yarn install` in each frontend (accepted trade-off).
- Compose: both services (`navi_frontend`, `navi_dev_frontend`) mount the folder so `yarn install` can find it, each at the path its own relative `file:` path resolves to (`/home/node/spec-support` for the dashboard, `/home/spec-support` for the dev frontend). Specs import from `node_modules` at test time, so the mount is only needed at install time. Same pattern as `./worker:/home/node/worker` for `source/`.
- CI (`jasmine-frontend`, `jasmine-dev-frontend`): no new step expected — `checkout` includes the folder and `yarn install` copies it. To confirm at planning time, along with whether the image build's `yarn_builder.sh` tolerates the `file:` dependency without the folder in the image (the `worker` precedent suggests it does).

**Repo-wide wiring (part of this issue)**
- Both `package.json` files: `--import` path in the scripts, `jasmine.helpers`, `c8.exclude`; remove the leftover `dev/frontend/spec/support/jasmine.json`.
- Drop the stub `@typescript-eslint` plugin from `dev/frontend/eslint.config.mjs` once `noop.js` moves.
- `dockerfiles/navi-hey-test/*` (`Dockerfile`, `navi-hey.package.json`, `jasmine.frontend.json`): copy/consume the shared folder instead of `frontend/spec/support/{dom,fetch,loader,transform_hooks}.js`, as it already copies `./worker/`.
- `.codacy.yaml`: exclude the new folder from analysis.
- Replace `dev/frontend` hand-rolled container/root setup and local `flushAsync` with the shared helpers where it can be done without changing what the specs verify (the broader spec-duplication rewrite stays in #887).

**Owner and docs**
- New dedicated agent `spec-support` owning `spec-support/`, following the convention of one agent per package (`worker`, `navi-client`): new `.claude/agents/spec-support.md`, and the `frontend` and `dev` agent scopes updated to point shared spec bootstrap there.
- Documentation: new `docs/agents/spec-support.md`, `AGENTS.md` folder table, `docs/agents/folder-structure.md`, plus mentions in `docs/agents/frontend.md` and `docs/agents/dev-app.md`. No npm-facing README is needed (package is private).

## Benefits
- Removes the duplicated bootstrap files between the two frontends
- Gives the dev frontend specs `useContainer`, removing the hand-rolled container/root setup in six specs, and a single `flushAsync`
- One place to change when the jsdom/React test setup needs updating
- Unblocks #887, which can rewrite the dev page specs on top of the shared helpers

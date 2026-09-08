# Issue: Backend: load and register extra route handlers from a mounted folder

## Description

Part of #794 (**extension track**). This is **IMPL-3**, the implementation of the
**Backend** section of `docs/agents/future/extension-architecture.md` (SPEC-3).

At web-server start, Navi should load and register **extra backend Express route
handlers** from an operator-mounted extension folder, so a product built on the
stock Navi image can add its own routes without forking Navi or rebuilding the
image. The mechanism is fully opt-in and **off by default**: a container that sets
no extension env var behaves exactly as it does today.

The env vars, mounted-folder layout, Docker volume target, registration contract,
security model, collision rules, and error handling are all fixed by the SPEC-3
"Shared contract" and "Backend" sections and are not re-litigated here.

### Dependencies

- Depends on **SPEC-3** (#794 / `extension-architecture.md`).
- Shares the extra-routes / mounted-folder / volume contract and the
  `ExtensionsEnv` resolver with **IMPL-4** (#804). #803 lands first and therefore
  **owns the shared plumbing** — `ExtensionsEnv` and the
  `source/lib/server/extensions/` folder; #804 builds on it and does not
  duplicate it.
- **Absorbs the two mechanical follow-ups** that
  `downstream-extension-workflow.md` had parked on IMPL-5 (#805): the
  `navi-hey/extension` subpath export and the image-level symlink that makes
  `navi-hey` resolvable from a file under the mounted folder. #805's scope
  shrinks accordingly — update its body / the SPEC-5 doc note when this lands.

## Problem

Backend routes are declared statically in `source/lib/server/Router.js`
(`GET_ROUTES` / `PATCH_ROUTES` / `POST_ROUTES` → `HandlerConfig`, built inside
`Router.build()`). Handlers extend `RequestHandler` and live under
`source/lib/server/handlers/`. Adding a route means editing `Router.js` and
rebuilding the server image. There is no supported way for a downstream product to
register its own backend routes.

## Expected Behavior

- With `NAVI_EXTENSIONS_ENABLED` truthy (`1` / `true` / `yes` / `on`, trimmed and
  lower-cased) and a valid module under `<NAVI_EXTENSIONS_DIR>/backend/`, its
  route responds.
- With `NAVI_EXTENSIONS_ENABLED` unset / empty / falsey (**default**), the folder
  is never scanned and nothing is loaded — rendered behavior identical to today.
- A broken extension module (import throws, bad export shape, invalid descriptor)
  is isolated: `Logger.warn` with filename + reason, that module is dropped, stock
  routes and other extension modules are unaffected, the server stays up.
- Enabled **and** `NAVI_EXTENSIONS_DIR` unset / non-existent / not a directory is
  the one fatal case: the server fails fast at startup.
- Path traversal / symlink escape out of `backend/` during module resolution is
  rejected (`PathValidator` precedent).
- Collisions never abort: an extra whose `method + path` matches a stock route is
  skipped with a warning (stock always wins); an extra colliding with an
  earlier-loaded extra (lexicographic filename order) is skipped with a warning.
- After loading, one `Logger.info` boot audit line lists the resolved route table
  (method, path, source filename).
- `PATCH /engine/reload` does **not** re-scan or rebuild the router; extensions
  are fixed for the process lifetime (documented known limitation).
- A `backend/*.js` module can `import { RequestHandler } from 'navi-hey/extension'`
  and have it resolve in both the production and the dev/spec containers.
- `yarn lint` and `yarn test` pass in `source/`.
- `docs/agents/web-server.md` is updated to describe the mechanism.

## Solution

### Loading (source/)

- **`ExtensionsEnv`** (`source/lib/server/extensions/ExtensionsEnv.js`) — minimal
  resolver reading `NAVI_EXTENSIONS_ENABLED` / `NAVI_EXTENSIONS_DIR` directly from
  `process.env` (like `BaseLogger` reads `LOG_LEVEL`). Not threaded through
  `WebConfig` / `ConfigParser` / the `webConfig` constructor argument.
- **Hoist the stock route maps.** Move `GET_ROUTES` / `PATCH_ROUTES` /
  `POST_ROUTES` out of `Router.build()` to module scope (or a small helper) and
  derive a frozen `Set` of `"METHOD path"` keys from them, so both `build()` and
  the loader read the same source of truth for collision checks.
- **`ExtensionRoutesLoader`** (`source/lib/server/extensions/`) — an **async**
  `load()` that returns a ready-to-register, collision-filtered array of
  `{ method, path, handler }` descriptors (empty when disabled). It:
  1. returns `[]` immediately when extensions are disabled;
  2. resolves `<dir>/backend/`, logs `Logger.info` and returns `[]` if it is
     absent / not a directory (the *enabled but `NAVI_EXTENSIONS_DIR` missing*
     case throws instead — fail-fast);
  3. lists `*.js` (flat, non-recursive), sorts lexicographically;
  4. `PathValidator`-guards each `path.resolve`d file, then
     `await import(pathToFileURL(...))`;
  5. reads `module.default ?? module.routes`, validates the array and each
     descriptor;
  6. filters out collisions against the frozen stock key `Set` and against
     already-accepted extras;
  7. emits the `Logger.info` boot audit line for the survivors.
- **Sync registration.** `Router.build()` stays **synchronous**. Its constructor
  gains an `extensionRoutes = []` option; `build()` registers those through
  `RouteRegister` + `HandlerConfig` (`register` for GET, `registerPatch` /
  `registerPost` for the others) — after the stock loops, **before**
  `express.static(staticDir)` and the catch-all `IndexHandler`.
- **The async step lives in the caller.** `ExtensionRoutesLoader.load()` is
  `await`ed before the web server is constructed:
  `ServerController.build()` (and its caller in `Application` /
  `ApplicationInstance`) becomes `async`, resolves the descriptor array, and
  passes it through `WebServer.build({ webConfig, menuConfig, extensionRoutes })`
  into the `Router`. `WebServer` and `Router` construction stay synchronous.
- **Error handling** — skip-and-warn per module; fail-fast only for a broken root
  (see Expected Behavior).
- **Security** — the opt-in flag is the primary control; operator-owned code runs
  in-process with full Node privileges, explicitly **not** sandboxed;
  `PathValidator` only stops the directory scan escaping `backend/`.

### Specifier resolution (source/package.json + dockerfiles/)

- **`exports` map in `source/package.json`** exposing the canonical bare subpath:

  ```json
  "exports": {
    ".": "./index.js",
    "./extension": "./lib/common/server/RequestHandler.js"
  }
  ```

  Verify no internal deep-import (node client, specs, bin) breaks once `exports`
  gates the package surface.
- **Image symlink** so Node can resolve `navi-hey` from a file under the mounted
  volume (the bind mount shadows anything written inside `NAVI_EXTENSIONS_DIR`):

  ```dockerfile
  RUN mkdir -p /navi/node_modules \
   && ln -s "$(npm root -g)/navi-hey" /navi/node_modules/navi-hey
  ```

  Added to the production image (`dockerfiles/production_navi_hey`) and the
  dev/app images (`dockerfiles/dev_navi_hey` / `dockerfiles/dev_app`) so fixture
  imports resolve identically under `spec/`.

### Tests & docs

- **Tests** — `source/spec/` coverage for load success, load failure, disabled
  flag, collision (stock and extra-vs-extra), and traversal rejection, using
  synchronous test dummies per `docs/agents/dangers.md`. Spec fixtures import the
  handler base class via a relative path (the `navi-hey/extension` specifier is
  exercised separately, once the symlink/exports are in place).
- **Docs** — update `docs/agents/web-server.md`.

### Out of scope

Token-gated extension handlers, HTTP verbs beyond GET/PATCH/POST, recursive
`backend/` subdirectories, hot-reload / re-scan on `/engine/reload`, and any form
of sandboxing — all deferred by SPEC-3.

## Benefits

- A product built on the stock `darthjee/navi` image adds its own backend routes
  with a volume mount and one env var — no fork, no image rebuild.
- Establishes the shared `ExtensionsEnv` + mounted-folder contract that the
  frontend half (IMPL-4 / #804) reuses.
- Opt-in and off by default, so existing deployments are completely unaffected.

## Agents

engine, docker.

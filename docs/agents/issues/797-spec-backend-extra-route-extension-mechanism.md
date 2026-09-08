# Issue: SPEC: backend extra-route extension mechanism

## Description

Spec issue — part of #794, **extension track**. Produces the architecture document
`docs/agents/future/extension-architecture.md`; no production code. Removed by
CLEAN-1 (#807) once the feature ships.

This issue owns two things:

1. **The shared contract** between the backend and frontend extra-route
   mechanisms — the extra-routes config surface, the mounted-folder layout, and
   the Docker volume mount point / env var names. SPEC-4 (#798, frontend half)
   references this contract rather than redefining it.
2. **The backend half** — how Navi discovers, loads, and registers extra Express
   route handlers from a mounted folder at server start, and the security posture
   for running operator-supplied code.

The document must be concrete enough that IMPL-3 (#803) can be implemented and
tested without re-deciding the contract or the security model.

## Current backend architecture (context for the spec)

- `source/lib/server/Router.js` — `build()` creates a fresh Express Router and a
  `RouteRegister`, then iterates three static maps (`GET_ROUTES`, `PATCH_ROUTES`,
  `POST_ROUTES`) of `path → HandlerConfig`. After the maps it mounts
  `express.static(staticDir)` and a catch-all `IndexHandler` (SPA fallback), so
  **extra routes must be registered before the static/catch-all fallback**.
- `source/lib/server/RouteRegister.js` — `register` / `registerPatch` /
  `registerPost` bind `handler.handle(req, res)` and map `ConflictError → 409`,
  `ForbiddenError → 403`, `NotFoundError → 404`, anything else → 500. GET is sync;
  PATCH/POST are `await`ed.
- `source/lib/common/server/HandlerConfig.js` — `new HandlerConfig(Class, params)`
  lazily does `new Class(req, res, ...params).handle()` per request.
- `source/lib/common/server/RequestHandler.js` — base class, no-op `handle()`;
  all stock handlers under `source/lib/server/handlers/` extend it.
- `source/lib/server/WebServer.js` — `new Router({ webConfig }).build()` is called
  once in the `WebServer` constructor.
- `webConfig` is a `WebConfig` model built by
  `source/lib/services/config/ConfigParser.js#webConfig()` from the YAML `web:`
  section (`port`, `links`, `api.token`, `memory`, …). This mechanism is **not**
  used here — the extension config is env-only (see Solution). Env precedent:
  `BaseLogger` reads `process.env.LOG_LEVEL` directly.
- `PATCH /engine/reload` → `Application.reload()` → `EngineController.reload()`
  re-reads config via `ConfigIncluder.resolve(entryFilePath)` and restarts the
  engine; the running `WebServer` is not rebuilt today.
- Security precedents: `source/lib/server/PathValidator.js`
  (`resolved.startsWith(baseDir + path.sep)`, throws `ForbiddenError`), used by
  `AssetsHandler`; `EnvStringResolver` for `${VAR}` interpolation in config;
  ESM-only, `.js` extensions, dynamic `import()` (no `require`); `console`
  restricted to `warn`/`error` — use `Logger`.

## Problem

Adding a backend route to Navi today means editing `source/lib/server/Router.js`
and rebuilding the image. A product built on top of the stock Navi image cannot
expose its own API/monitoring endpoints without forking.

There is no defined answer to:

- Where an operator declares extra routes, and in what shape.
- What directory they mount, and how modules inside it are resolved.
- How loaded handlers are registered alongside stock routes, and what happens when
  a module throws on import.
- The trust boundary and safeguards for executing operator-supplied code.
- What happens when an extra route path collides with a stock route.
- Whether `PATCH /engine/reload` re-scans the mounted folder.

SPEC-4 (#798) needs the same env/folder/volume contract, so it must be settled
here first. IMPL-3 (#803) is blocked until it is.

## Expected Behavior

Deliverable: `docs/agents/future/extension-architecture.md`, with a **Shared
contract** section (referenced by SPEC-4) and a **Backend** section, covering:

### Shared contract (also consumed by SPEC-4 / #798)

- **Config surface** — env vars only, no YAML key: `NAVI_EXTENSIONS_ENABLED`
  (**off by default**, must be truthy to load anything) and `NAVI_EXTENSIONS_DIR`
  (mounted-code path, default `/navi/extensions`). The versioned navi YAML is
  untouched; the enable decision lives in the container environment.
- **Mounted-folder layout** — a single mount at `NAVI_EXTENSIONS_DIR` with
  `backend/` and `frontend/` subtrees; naming and module-resolution rules.
- **Volume / env names** — the exact compose volume target (`/navi/extensions`)
  and the two env var names above, written once so SPEC-4, SPEC-5 (#799) and the
  Dockerfiles agree. Note the asymmetry to resolve in SPEC-4: the backend reads
  these at runtime, but the frontend is built by Vite — SPEC-4 must state how the
  `frontend/` subtree and the enable flag are surfaced at build/serve time.

### Backend section

- **Extra-routes config** — final shape of each route entry
  (`method`, `path`, module reference) OR the "modules self-declare" alternative;
  land on one.
- **Loading mechanism** — dynamic `import()` of ESM from
  `<path>/backend/`, when it runs (during `Router.build()` / `WebServer`
  construction), and how descriptors become `RouteRegister` calls (reusing
  `HandlerConfig`). Registration happens before `express.static` + the catch-all.
- **Module contract** — what an extension module must export and what shape a
  handler takes (a `RequestHandler` subclass, a plain `(req, res)` function, or a
  descriptor object), including sync-GET vs. async-PATCH/POST and the
  `ConflictError`/`ForbiddenError`/`NotFoundError` → status mapping it can rely on.
- **Error handling** — a module that throws on import, exports the wrong shape, or
  names a bad method/path: skip-and-warn per module vs. fail-fast for the server.
- **Security model** — trust boundary (operator-controlled, same as the YAML
  config and mounted config files); explicitly *not* sandboxed; `PathValidator`
  applied to module resolution under `<path>/backend`; the opt-in flag; the
  warnings that must appear in user docs.
- **Collision handling** — extra path equal to a stock route, or two extra routes
  clashing: precedence and whether it warns or aborts.
- **Config plumbing & reload** — where the env-derived extensions config is read
  (recommend a small `ExtensionsEnv` resolver read during `Router.build()`; no
  `WebConfig` / `webConfig` change), and a definitive statement on
  `PATCH /engine/reload` behaviour (re-scan vs. restart-only).

Every point lands on a **concrete recommendation**, not an options list.

## Solution

Positions to document (settled in discussion on this issue):

- **Config surface**: env-only. `NAVI_EXTENSIONS_ENABLED` must be truthy (default
  off) and `NAVI_EXTENSIONS_DIR` gives the mounted-code path (default
  `/navi/extensions`). No `web.*` YAML key, no `WebConfig` field — the navi YAML
  is untouched. Read via a small dedicated `ExtensionsEnv` resolver (precedent:
  `BaseLogger` reading `process.env.LOG_LEVEL`).
- **Mounted-folder layout**: one volume mounted at `NAVI_EXTENSIONS_DIR`, with
  `backend/` and `frontend/` subtrees. Backend modules are the `.js` files
  (ESM) directly under `backend/`.
- **Route declaration**: modules **self-declare**. Each file under
  `<dir>/backend/` default-exports (or exports `routes`) an array of descriptors
  `{ method, path, handler }` where `handler` is a `RequestHandler` subclass
  (matching every stock handler). Nothing carries a per-route list — the folder is
  the source of truth; `Logger.info` prints the loaded route table at boot for
  auditability.
- **Loading**: dynamic `import()` during `Router.build()`, registered through the
  existing `RouteRegister` before `express.static` + catch-all.
- **Error handling**: skip-and-warn per module (`Logger.warn`, drop that module,
  keep the server up) — consistent with the menu spec (#796) and Navi's parser
  warnings. `NAVI_EXTENSIONS_ENABLED` truthy but `NAVI_EXTENSIONS_DIR` missing or
  not a directory is a fail-fast startup error.
- **Security**: operator-controlled trust boundary, identical to the navi YAML and
  the mounted menu file; not sandboxed; `PathValidator` bounds module resolution
  to `<dir>/backend`; single opt-in env flag; explicit "you are running arbitrary
  code you mounted" warning in the user guide.
- **Collision**: stock routes always win; an extra route matching a stock path is
  skipped with a warning. Two extra routes clashing: first loaded wins, second
  skipped with a warning.
- **Reload**: `PATCH /engine/reload` does **not** re-scan extensions (ESM modules
  are cached for the process lifetime); picking up new/changed extension code
  needs a container restart. Documented as a known limitation.

## Benefits

- SPEC-4 (#798), SPEC-5 (#799) and the Dockerfiles all build on one agreed
  env/folder/volume contract instead of three guesses.
- IMPL-3 (#803) has an unambiguous module contract, loading point, and security
  posture to implement and test.
- Reuses existing building blocks (`RouteRegister`, `HandlerConfig`,
  `RequestHandler`, `PathValidator`, `Logger`, `EnvStringResolver`) rather than
  inventing parallel machinery.
- Keeps the trust model honest and explicit: opt-in, operator-owned, not
  sandboxed, documented as such.

# Feature: Operator-supplied route extensions

Part of #794 (**extension track**). This document is transient design material: it
is removed by CLEAN-1 (#807) once the feature ships, with anything lasting folded
into `docs/agents/web-server.md` / `docs/agents/frontend.md` / a user guide.

The extension mechanism lets a product built on top of the stock Navi image add
its own Express route handlers (backend) and — via SPEC-4 (#798) — its own SPA
assets (frontend) **without forking Navi**. It is fully opt-in and **off by
default**: a container that sets no extension env var behaves exactly as it does
today.

This file owns two things:

1. The **Shared contract** — the env vars, the mounted-folder layout, and the
   Docker volume target. SPEC-4 (#798, the frontend half) links to this section
   rather than redefining any of it.
2. The **Backend** section — how Navi discovers, loads, and registers extra
   Express route handlers from the mounted folder at server start, plus the
   security posture for running operator-supplied code.

Implementation issues:

- **IMPL-3 (#803)** — implements the Backend section below. It must be buildable
  and testable from this document with no further decisions.
- **SPEC-4 (#798)** — appends a `## Frontend` section to this same file, built on
  the Shared contract.
- **SPEC-5 (#799)** and the Dockerfiles — reference the volume target and env var
  names fixed here.
- **CLEAN-1 (#807)** — deletes this document once the feature ships.

---

## Shared contract

The single source of truth for the env/folder/volume surface. SPEC-4 (#798)
consumes this section verbatim; SPEC-5 (#799) and the Dockerfiles must use the
exact names below.

### Environment variables

The enable decision and the mounted path are **container-environment concerns**,
not versioned application config. There is deliberately **no YAML key** and **no
`WebConfig` field** — the navi YAML is untouched by this feature. Precedent:
`source/lib/common/utils/logging/BaseLogger.js` reads `process.env.LOG_LEVEL`
directly.

| Variable | Default | Meaning |
|---|---|---|
| `NAVI_EXTENSIONS_ENABLED` | *(unset — off)* | Must be **truthy** for anything to load. When unset, empty, or a falsey string, the entire mechanism is inert and no folder is scanned. |
| `NAVI_EXTENSIONS_DIR` | `/navi/extensions` | Absolute path to the mounted extension folder inside the container. |

**Truthy definition.** `NAVI_EXTENSIONS_ENABLED` is enabled when its trimmed,
lower-cased value is one of `1`, `true`, `yes`, `on`. Everything else (including
unset, `0`, `false`, `no`, `off`, empty string) is disabled. IMPL-3 fixes this
list; it must be documented in the user guide.

**Rationale for env-only.** Whether a deployment runs extra code, and where that
code lives, is a property of *that deployment*, not of the crawl configuration
that Navi versions and reloads. Keeping it out of the YAML also means
`PATCH /engine/reload` (which re-reads YAML) has no bearing on extensions — see
[Config plumbing & reload](#config-plumbing--reload).

### Mounted-folder layout

A single volume is mounted at `NAVI_EXTENSIONS_DIR`. It contains two reserved
subtrees:

```
/navi/extensions/
  backend/     # ESM .js modules loaded by the Navi web server (this document)
  frontend/    # SPA assets — layout owned by SPEC-4 (#798)
```

- **`backend/`** — flat directory of ESM `.js` files. Every `*.js` file directly
  under `backend/` is a candidate module (non-recursive in v1; nested
  directories under `backend/` are ignored, not an error). Non-`.js` files are
  ignored. Load order is the directory listing sorted lexicographically by
  filename, so collisions resolve deterministically (see
  [Collision handling](#collision-handling)).
- **`frontend/`** — reserved here; its internal layout and how it reaches the
  Vite build/serve step are **SPEC-4's call**. This document only guarantees the
  subtree name.
- Either subtree may be absent. `backend/` absent (while extensions are enabled
  and `NAVI_EXTENSIONS_DIR` itself is a valid directory) means "no backend
  extensions" — a `Logger.info` note, not an error.

### Volume / naming

These names are fixed here and must be reused unchanged by SPEC-4 (#798),
SPEC-5 (#799), and every Dockerfile / compose file:

- **Container mount point:** `/navi/extensions` (the `NAVI_EXTENSIONS_DIR`
  default).
- **Env var names:** `NAVI_EXTENSIONS_ENABLED`, `NAVI_EXTENSIONS_DIR`.

Compose example (host folder is the operator's; matches the existing
`docker_volumes` style in `docker-compose.yml`):

```yaml
services:
  navi:
    image: darthjee/navi:latest
    environment:
      NAVI_EXTENSIONS_ENABLED: "true"
      # NAVI_EXTENSIONS_DIR defaults to /navi/extensions
    volumes:
      - ./my-extensions:/navi/extensions
```

### Build-time vs. runtime note (open item for SPEC-4)

The backend reads `NAVI_EXTENSIONS_ENABLED` / `NAVI_EXTENSIONS_DIR` **at
container runtime**, when the web server builds its router. The frontend is a
**Vite build** that is produced into `source/static/` *before* the container
runs. SPEC-4 (#798) must state how the `frontend/` subtree and the enable flag
are surfaced at build/serve time — e.g. a runtime copy of `frontend/` assets
into the static dir served by `express.static`, versus a rebuild. This document
does not decide that; it only reserves the `frontend/` subtree and the two env
var names so SPEC-4 has a fixed contract to build on.

---

## Backend

Everything below is IMPL-3 (#803)'s specification. Each subsection ends on a
single concrete recommendation.

### Current backend architecture (context)

- `source/lib/server/Router.js` — `build()` creates a fresh Express Router and a
  `RouteRegister`, iterates three static maps (`GET_ROUTES`, `PATCH_ROUTES`,
  `POST_ROUTES`) of `path → HandlerConfig`, then mounts
  `express.static(staticDir)` and a catch-all `IndexHandler` (SPA fallback).
  **Extra routes must be registered inside `build()`, after the stock maps but
  before the `express.static` / catch-all lines.**
- `source/lib/server/RouteRegister.js` — `register` (GET, synchronous),
  `registerPatch` / `registerPost` (both `await` the handler). All three wrap
  `handler.handle(req, res)` in a `try/catch` that maps `ConflictError → 409`,
  `ForbiddenError → 403`, `NotFoundError → 404`, and anything else → 500, then
  `Logger.debug`s the access line.
- `source/lib/common/server/HandlerConfig.js` —
  `new HandlerConfig(Class, params)`; its `handle(req, res)` does
  `new Class(req, res, ...params).handle()` per request. `params` is normalised
  to an array.
- `source/lib/common/server/RequestHandler.js` — base class with a no-op
  `handle()`; every stock handler under `source/lib/server/handlers/` extends it
  and takes `(request, response, ...extra)` in its constructor.
- `source/lib/server/SecuredRequestHandler.js` — extends `RequestHandler`, adds
  bearer-token gating; subclasses implement `process()` instead of `handle()`.
- `source/lib/server/WebServer.js` — the constructor calls
  `this.#app.use(new Router({ webConfig }).build())` exactly once.
  `WebServer.build()` returns `null` when there is no `webConfig`.
- `source/lib/server/PathValidator.js` — `new PathValidator(baseDir)`;
  `isValid(resolved)` is `resolved.startsWith(baseDir + path.sep)`;
  `validate(resolved)` throws `ForbiddenError` otherwise. Used by
  `AssetsHandler` with `path.resolve(baseDir, rel)`.
- `source/lib/services/engine/EngineController.js` — `reload()` re-reads config
  (`NamespaceMap.include(ConfigIncluder.resolve(entryFilePath))`) and restarts
  the engine. The running `WebServer` / `Router` are **not** rebuilt.
- Conventions (`docs/agents/architecture/style-and-tooling.md`): ESM only, `.js`
  extensions, dynamic `import()` (no `require`), `console` limited to
  `warn`/`error` (use `Logger`), max file length 300 lines, max complexity 10.

### Route declaration & module contract

**Recommendation: modules self-declare; the folder is the only source of
truth.** There is no manifest file and no per-route list anywhere.

Each `backend/*.js` module exports an array of route descriptors, as **either**
the default export **or** a named export `routes`:

```js
// /navi/extensions/backend/health.js
import { RequestHandler } from '/home/node/app/lib/common/server/RequestHandler.js';

class HealthHandler extends RequestHandler {
  constructor(_request, response) {
    super();
    this.response = response;
  }

  handle() {
    this.response.json({ status: 'ok', service: 'my-product' });
  }
}

export default [
  { method: 'GET', path: '/ext/health.json', handler: HealthHandler },
];
```

Descriptor shape:

| Field | Required | Constraint |
|---|---|---|
| `method` | yes | one of `GET`, `PATCH`, `POST` (case-insensitive), matching the three stock maps. No other verbs in v1. |
| `path` | yes | non-empty string starting with `/`. No whitespace. Express path syntax (`:param`, `*splat`) is allowed — it is passed straight to the router. |
| `handler` | yes | a `RequestHandler` subclass (a *class*, not an instance), instantiated per request exactly like every stock handler: `new handler(req, res)`. |

**Guarantees the handler inherits from `RouteRegister`** (identical to stock
handlers — extension authors rely on these and nothing more):

- A `GET` handler's `handle()` runs **synchronously**; a `PATCH` / `POST`
  handler's `handle()` is **`await`ed**, so it may be `async`.
- Throwing `ConflictError` → `409`, `ForbiddenError` → `403`,
  `NotFoundError` → `404` (these live under
  `source/lib/exceptions/http/`). Any other throw → `500` with
  `{ error: 'Internal Server Error' }`.
- The handler owns the response: it must call `res.json(...)` / `res.status(...)`
  / `res.send(...)` itself, same as stock handlers.
- `express.json()` body parsing is already applied, so `req.body` is populated
  for `PATCH` / `POST`.

**Token-gated extras.** An author who wants a secured route extends
`SecuredRequestHandler` instead and implements `process()`; the descriptor still
just names the class. The constructor's third argument (the configured token) is
**not** wired for extensions in v1 — `SecuredRequestHandler` with no token
rejects every request by design, so a v1 secured extra is effectively disabled.
Extras are **public by default**, like the stock monitoring routes. Passing an
extension-supplied token is deferred (recorded under
[Deferred / out of scope](#deferred--out-of-scope)).

**Boot audit line.** After all modules load, the loader emits one
`Logger.info` with the full resolved route table (method, path, source
filename), so an operator can confirm what was mounted:

```
[extensions] loaded 2 backend route(s): GET /ext/health.json (health.js), POST /ext/reindex (reindex.js)
```

### Loading mechanism

**Recommendation: a dedicated loader invoked from `Router.build()`.**

Sketch — `source/lib/server/extensions/ExtensionRoutesLoader.js` (name is
IMPL-3's to finalise):

1. `Router.build()`, after populating the three stock maps and running the three
   `Object.entries(...).forEach(register...)` loops, but **before**
   `router.use(express.static(staticDir))`, calls
   `new ExtensionRoutesLoader({ register }).load()`.
2. The loader reads `ExtensionsEnv` (see
   [Config plumbing & reload](#config-plumbing--reload)). If extensions are
   disabled, it returns immediately (no-op).
3. It resolves `backendDir = path.join(extensionsDir, 'backend')`. If
   `backendDir` does not exist or is not a directory, it logs one
   `Logger.info` ("no backend extensions") and returns. (The *enabled but
   `NAVI_EXTENSIONS_DIR` itself missing* case is fatal — see
   [Error handling](#error-handling).)
4. It lists `backendDir`, keeps `*.js` files, sorts them lexicographically.
5. For each file it computes `resolved = path.resolve(backendDir, name)`,
   runs `new PathValidator(backendDir).validate(resolved)` (defends against
   symlink / `..` trickery in the directory listing), then
   `await import(pathToFileURL(resolved))`.
6. It reads `module.default ?? module.routes`, validates the array and each
   descriptor (below), applies collision rules
   ([Collision handling](#collision-handling)), then feeds each surviving
   descriptor through the injected `RouteRegister`:
   `register.register({ route, handler: new HandlerConfig(handler) })` for
   `GET`, `register.registerPatch(...)` for `PATCH`,
   `register.registerPost(...)` for `POST` — i.e. it reuses `HandlerConfig`
   exactly as the stock maps do.
7. After the loop it emits the boot audit line.

Because `load()` performs `await import(...)`, `Router.build()` and the
`WebServer` constructor become `async` for this path, **or** the loader is
handed a pre-resolved list. **Recommendation:** make the extension load an
explicit `async` step — `WebServer.build()` becomes `async` and its one caller
(`ServerController` / `ApplicationInstance`) `await`s it. Stock routes stay
synchronous; only the extension step is awaited. IMPL-3 confirms the exact
call-site plumbing but must not block the event loop with a sync `import`
workaround.

### Error handling

**Recommendation: skip-and-warn per module; fail-fast only for a broken
root.** Consistent with the menu spec (#796) and Navi's parser warnings
(`source/lib/parsers/css_selector_parser/FilterMatcher.js`,
`source/lib/utils/HtmlElementParser.js`).

Per-module — wrapped in `try/catch`, on failure `Logger.warn` with the filename
and reason, drop that module, keep going, server stays up:

- module throws during `import()` (syntax error, top-level throw, bad import);
- neither `default` nor `routes` is an array;
- a descriptor is missing `method` / `path` / `handler`, or `method` is not
  GET/PATCH/POST, or `path` does not start with `/` or contains whitespace, or
  `handler` is not a function (class);
- `PathValidator` rejects the resolved file path (symlink escaping
  `backend/`).

Example warning:

```
[extensions] skipping backend/reindex.js: descriptor 0 has unsupported method "DELETE"
```

Fail-fast — `throw` at startup, server does **not** come up (mirrors
`ConfigLoader`'s posture for a broken config root):

- `NAVI_EXTENSIONS_ENABLED` is truthy **and** `NAVI_EXTENSIONS_DIR` is unset,
  points at a non-existent path, or points at something that is not a directory.

That is the only fatal case: "you told me to load extensions and the mount
isn't there" is an operator deployment error, not a soft-degrade.

### Security model

**Recommendation: opt-in, operator-owned, explicitly not sandboxed.**

- **Trust boundary.** Loading a `backend/*.js` module executes it in the Navi
  process with full Node privileges. This is the **same trust level** as the
  navi YAML config and the mounted menu file (#795/#796): the operator controls
  both the container environment (the enable flag) and the volume contents (the
  code). If an attacker can write to `NAVI_EXTENSIONS_DIR` or set
  `NAVI_EXTENSIONS_ENABLED`, they already control the deployment.
- **Not sandboxed, not resource-limited.** No `vm` context, no worker isolation,
  no CPU/memory caps, no allow-list of importable modules. An extension can do
  anything the Navi process can. This is a deliberate v1 decision, not an
  oversight — sandboxing operator-owned code adds large complexity for no threat
  it actually closes.
- **`PathValidator` scope.** It is applied to module resolution under
  `<NAVI_EXTENSIONS_DIR>/backend` **only** to stop the directory scan from
  following a symlink or `..` entry out of `backend/`. It does **not** constrain
  what the loaded code then does (it can `import` anything, read any file, open
  sockets).
- **Primary control is the opt-in flag.** A stock image with
  `NAVI_EXTENSIONS_ENABLED` unset never touches the folder even if a volume is
  mounted.
- **User-doc requirement.** The user guide (SPEC-5 / #799 and the how-to)
  **must** carry a plain-language warning, e.g.:

  > Enabling extensions runs arbitrary JavaScript that you mount into the
  > container, in the same process as Navi, with no isolation. Only mount code
  > you wrote or audited, and only from a volume you control.

### Collision handling

**Recommendation: stock always wins; among extras, first loaded wins. Never
abort.**

Before registering an extra descriptor, the loader checks its `method + path`:

- **Against the stock routes** (the three `*_ROUTES` maps in `Router.build()` —
  the loader is given them, or a frozen `Set` of `"METHOD path"` keys built from
  them): if it matches a stock route, **skip the extra** and `Logger.warn`.
  Stock behaviour is never shadowed.
- **Against already-registered extras** (earlier file in the sorted load order,
  or an earlier descriptor in the same file): **skip the later one** and
  `Logger.warn`. Load order is the lexicographic filename sort, so this is
  deterministic.

```
[extensions] skipping GET /stats.json from backend/stats.js: path is a built-in Navi route
[extensions] skipping POST /ext/reindex from backend/z_dupe.js: already registered by backend/reindex.js
```

A collision is **never** fatal — the rest of the table still loads.

### Config plumbing & reload

**Recommendation: a tiny `ExtensionsEnv` resolver read inside
`Router.build()`; no `WebConfig` change; `reload` does not re-scan.**

- **`ExtensionsEnv`** — `source/lib/server/extensions/ExtensionsEnv.js` (or
  `source/lib/common/...` if IMPL-3 wants it shared). A minimal resolver with,
  e.g., `ExtensionsEnv.enabled` (truthy check on `NAVI_EXTENSIONS_ENABLED`) and
  `ExtensionsEnv.dir` (`NAVI_EXTENSIONS_DIR` or `/navi/extensions`). It reads
  `process.env` directly, exactly like `BaseLogger` reads `LOG_LEVEL`. It is
  **not** threaded through `WebConfig`, `ConfigParser`, or the `webConfig`
  constructor argument — those stay exactly as they are.
- **`PATCH /engine/reload`** re-reads the navi YAML and restarts the **engine**
  only. It does **not** rebuild the `WebServer` or the `Router`, and it does
  **not** re-scan `NAVI_EXTENSIONS_DIR`. Extensions are therefore **fixed for
  the process lifetime**: picking up new, changed, or removed extension code
  requires a **container restart**.
- **Rationale for not re-scanning.** ESM modules are cached by the runtime for
  the process lifetime, so a re-scan could not actually reload changed code
  without cache-busting hacks; and keeping extension load strictly at
  boot keeps its blast radius small and its timing predictable. This is a
  **documented known limitation**, called out in the user guide.

### Deferred / out of scope

Not half-specified here. Each gets its own `docs/agents/future/` note and its own
issue under #794 if genuinely needed:

- recursive `backend/` subdirectories;
- HTTP verbs beyond GET/PATCH/POST;
- wiring a configured token into extension `SecuredRequestHandler` subclasses;
- hot-reload / re-scan of extensions on `PATCH /engine/reload`;
- any form of sandboxing, permission model, or importable-module allow-list;
- a manifest file or YAML config key for routes;
- npm-dependency installation for extension code (extensions may only import
  what the Navi image already ships plus their own bundled `.js`).

---

## Cross-references

- **#794** — umbrella issue for the menu + extension tracks.
- **Shared contract** (above) — consumed verbatim by SPEC-4 (#798).
- **SPEC-4 (#798)** — the frontend half; appends `## Frontend` to this file.
- **SPEC-5 (#799)** — user-facing docs; must carry the security warning and the
  reload limitation, and reuse the env/volume names fixed above.
- **IMPL-3 (#803)** — implements the Backend section.
- **#795 / #796** — the menu track; shares the "mounted file, operator-controlled
  trust boundary" language.
- **CLEAN-1 (#807)** — deletes this document once the feature ships, folding the
  durable parts into `docs/agents/web-server.md`.
</content>
</invoke>

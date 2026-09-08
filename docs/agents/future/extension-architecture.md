# Feature: Operator-supplied route extensions

Part of #794 (**extension track**). This document is transient design material: it
is removed by CLEAN-1 (#807) once the feature ships, with anything lasting folded
into `docs/agents/web-server.md` / `docs/agents/frontend.md` / a user guide.

The extension mechanism lets a product built on top of the stock Navi image add
its own Express route handlers (backend) and — via SPEC-4 (#798) — its own SPA
assets (frontend) **without forking Navi**. It is fully opt-in and **off by
default**: a container that sets no extension env var behaves exactly as it does
today.

This file owns three things:

1. The **Shared contract** — the env vars, the mounted-folder layout, and the
   Docker volume target. The Backend and Frontend sections both build on it
   rather than redefining any of it.
2. The **Backend** section — how Navi discovers, loads, and registers extra
   Express route handlers from the mounted folder at server start, plus the
   security posture for running operator-supplied code.
3. The **Frontend** section — how the running SPA discovers, loads, and mounts
   operator-supplied dashboard routes and menu entries from the same mounted
   folder, and how the two new asset/manifest routes are served.

Implementation issues:

- **IMPL-3 (#803)** — implements the Backend section below. It must be buildable
  and testable from this document with no further decisions.
- **SPEC-4 (#798)** — added the `## Frontend` section below, built on the Shared
  contract.
- **IMPL-4 (#804)** — implements the Frontend section. It spans `frontend/`
  (bootstrap fetch, router wiring, error boundary, `index.html` import map) and
  `source/` (two new handlers wired into `Router.build()`).
- **SPEC-5 (#799)** — the downstream-developer workflow,
  [`downstream-extension-workflow.md`](downstream-extension-workflow.md), and the
  permanent user guide
  [`docs/guides/navi/extending-navi.md`](../../guides/navi/extending-navi.md).
  Reuses the volume target and env var names fixed here; the security warning, the
  reload limitation, and the external-React build snippet move to that guide.
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

### Build-time vs. runtime note

The backend reads `NAVI_EXTENSIONS_ENABLED` / `NAVI_EXTENSIONS_DIR` **at
container runtime**, when the web server builds its router. The frontend is a
**Vite build** that is produced into `source/static/` *before* the container
runs, and the running image carries no toolchain to rebuild it.

**Resolved by SPEC-4 (#798)** — see [Frontend › Enable flag on a static
SPA](#enable-flag-on-a-static-spa) and [Frontend › Strategy
decision](#strategy-decision): the SPA is **not** rebuilt and **not** re-copied.
Extensions are *pre-built ESM bundles* mounted under `frontend/`; the running SPA
discovers them at boot via a Navi-served manifest, and the enable flag is applied
**server-side** (the manifest returns an empty list when disabled), so one
unchanged built SPA serves both the enabled and disabled modes.

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
- **User-doc requirement.** The user guide
  ([`docs/guides/navi/extending-navi.md`](../../guides/navi/extending-navi.md),
  SPEC-5 / #799) **must** carry a plain-language warning, e.g.:

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

## Frontend

Everything below is IMPL-4 (#804)'s specification. IMPL-4 spans **two areas** —
`frontend/` (bootstrap fetch, router wiring, error boundary, `index.html` import
map) and `source/` (two new handlers wired into `Router.build()`) — and must be
buildable and testable from this document with no further decisions. Each
subsection ends on a single concrete recommendation. It builds on the
[Shared contract](#shared-contract) above unchanged: same two env vars, same
`NAVI_EXTENSIONS_DIR`, same reserved `frontend/` subtree.

### Current frontend architecture (context)

- `frontend/` is a Vite + React 19 SPA. `frontend/src/main.jsx` calls
  `createRoot(...).render(...)` synchronously at module load with a literal
  `<HashRouter><Routes>` tree; every page is a static `import` from
  `frontend/src/components/pages/`. There is **no runtime module loading** today.
- `frontend/vite.config.js` builds to `frontend/dist`.
  `scripts/ci/build-frontend.sh` runs `yarn build` then
  `cp -r frontend/dist/. source/static/`. This happens at **npm-publish /
  image-build time**, not in the running container.
- The **production image ships neither the frontend source nor the Vite
  toolchain**: `dockerfiles/production_navi_hey/Dockerfile` is just
  `npm install -g navi-hey@<version>`; the package already contains a built
  `source/static/`.
- `source/lib/server/Router.js` `build()` serves the SPA:
  `express.static(staticDir)` (`staticDir = <pkg>/source/static`),
  `GET /assets/*path` via `AssetsHandler`, and a catch-all `IndexHandler` →
  `source/static/index.html`. Extra routes register **inside `build()`, after the
  stock maps, before `express.static` / catch-all** — identical to the Backend
  rule above.
- `source/lib/server/handlers/AssetsHandler.js` — the precedent for the new asset
  handler: `[].concat(req.params.path).join(path.sep)` →
  `path.resolve(baseDir, rel)` → `new PathValidator(baseDir).validate(resolved)` →
  `res.sendFile`.
- `source/lib/server/PathValidator.js` — `new PathValidator(baseDir)`;
  `validate()` throws `ForbiddenError` (→ 403 via `RouteRegister`).
- `source/lib/server/extensions/ExtensionsEnv.js` (from IMPL-3 / the Backend
  section) — the shared resolver for `NAVI_EXTENSIONS_ENABLED` /
  `NAVI_EXTENSIONS_DIR`. The frontend handlers read **this same resolver**, not a
  second env mechanism.
- The menu is being made config-driven by IMPL-1 / IMPL-2 (#801 / #802) per
  `menu-configuration.md`; its entry shape is `{ route, text }` and its serving
  route is SPEC-1's call (placeholder `/menu.json`).

### Strategy decision

**Recommendation: runtime registration of pre-built bundles. No SPA rebuild.**

Two options were considered:

| | Build-time SPA rebuild | Runtime registration *(chosen)* |
|---|---|---|
| Operator step | re-run Vite with the extension source merged in, produce a new `source/static/`, bake a derived image | drop pre-built `*.js` into a mounted folder, set one env var |
| Image needs | full frontend toolchain (Vite, React, yarn) in a derived build stage | nothing added — stock image unchanged |
| Coupling | extension pinned to Navi's exact React / build config; every Navi bump ⇒ rebuild | extension is an independent artefact |
| Failure blast radius | a bad extension breaks the whole bundle / build | a bad bundle is skipped at load, stock UI intact |

The published package carries **no toolchain** (see *Current frontend
architecture*), so "rebuild the SPA" forces every downstream product into a
multi-stage Docker build that reproduces Navi's frontend pipeline. Runtime
registration keeps the derived-image story **symmetric with the Backend** (mount
a volume, set `NAVI_EXTENSIONS_ENABLED`, import only what the image ships plus
your own bundled `.js`) and keeps a broken extension non-fatal. The cost — the
SPA must externalise React so extensions share one instance (see *Single React
instance*) — is a one-time `index.html` change, not a per-deployment one.

### `frontend/` subtree layout

**Recommendation: flat, non-recursive, one pre-built ESM bundle per
`frontend/*.js`.**

```
/navi/extensions/
  frontend/
    reports.js      # pre-built ESM bundle, default-exports a descriptor array
    reports.css     # optional, same basename — loaded when its bundle loads
    audit.js
```

- Every `*.js` **directly under** `frontend/` is a candidate bundle. Nested
  directories are ignored (not an error), matching `backend/`. Non-`.js` files
  are not enumerated (but a sibling `*.css` is fetched alongside its bundle —
  below).
- Enumeration order is the directory listing sorted **lexicographically by
  filename**, so route and menu order are deterministic, mirroring the Backend.
- Each bundle's **default export is an array of route descriptors**:

  | Field | Required | Constraint |
  |---|---|---|
  | `path` | yes | non-empty string starting with `/`, no whitespace. Becomes a `<Route path>` under the existing `HashRouter`, so the user-visible URL is `#<path>`. |
  | `text` | yes | non-empty string. The menu label for this route (see *Menu integration*). |
  | `component` | yes | a React component (function or class), rendered as the route element. May itself be `React.lazy(...)` — the host does not care. |

  ```js
  // /navi/extensions/frontend/reports.js  (already built, React external)
  import Reports from './Reports.js'; // bundled into reports.js by the operator's build

  export default [
    { path: '/ext/reports', text: 'Reports', component: Reports },
  ];
  ```

- **Optional sibling CSS.** If `frontend/<name>.css` exists next to
  `frontend/<name>.js`, the host injects
  `<link rel="stylesheet" href="/extensions/frontend/<name>.css">` when it loads
  `<name>.js`. A bundle may also import its own CSS if the operator's build
  inlines it; the sibling file is a convenience, not a requirement.

### Discovery

**Recommendation: a Navi-generated manifest at a fixed URL. The folder is the
source of truth; the SPA never guesses filenames.**

New handler → `GET /extensions/frontend.json`:

- Reads `ExtensionsEnv`. If extensions are **disabled**, or
  `NAVI_EXTENSIONS_DIR/frontend/` is absent / not a directory, respond
  `200 { "bundles": [] }` (never 404 — an empty list is a valid answer and keeps
  the SPA's boot path single).
- Otherwise enumerate `frontend/*.js` (flat, lexicographic) and respond:

  ```json
  {
    "bundles": [
      { "src": "/extensions/frontend/audit.js", "css": "/extensions/frontend/audit.css" },
      { "src": "/extensions/frontend/reports.js" }
    ]
  }
  ```

  - `src` — the asset-route URL for the bundle (see *Asset serving*).
  - `css` — present only when a sibling `<name>.css` exists; omitted otherwise.
- The manifest deliberately carries **no route / menu data** — `path`, `text`,
  and `component` live in the bundle itself, so the folder is the single source
  of truth, exactly as the Backend reads routes from each module rather than a
  manifest.

Why a Navi-generated manifest rather than a fixed entry file the SPA imports: a
fixed `frontend/index.js` would make the operator maintain an import list by hand
and re-export every bundle, and a missing or broken `index.js` would take out all
extensions at once. Enumerating server-side keeps "drop a file in the folder" as
the whole operator workflow and isolates each bundle from the others.

### Router wiring

**Recommendation: an async bootstrap step in front of `createRoot`, merging
extension `<Route>`s after the stock routes.**

`frontend/src/main.jsx` becomes a thin async bootstrap (delegating to
`frontend/src/extensions/loadExtensions.js`):

1. `fetch('/extensions/frontend.json')` → parse `{ bundles }`. Any network error,
   non-2xx response, or JSON parse error ⇒ treat as `{ bundles: [] }` (see
   *Failure mode*).
2. For each bundle, **in manifest order**:
   - if `css` is set, append `<link rel="stylesheet" href={css}>` to `<head>`;
   - `await import(/* @vite-ignore */ src)`;
   - read `mod.default`; validate it is an array and each descriptor has a string
     `path` starting with `/`, a non-empty string `text`, and a function
     `component`. Invalid ⇒ `console.warn`, skip that bundle (or that
     descriptor), continue.
3. Collect the surviving descriptors into `extensionRoutes`.
4. Render **once**:

   ```jsx
   createRoot(document.getElementById('root')).render(
     <StrictMode>
       <HashRouter>
         <Routes>
           <Route path="/" element={<Layout />}>
             {/* ...stock routes unchanged... */}
             <Route element={<ExtensionErrorBoundary />}>
               {extensionRoutes.map(({ path, component: C }) => (
                 <Route key={path} path={path.replace(/^\//, '')} element={<C />} />
               ))}
             </Route>
           </Route>
         </Routes>
       </HashRouter>
     </StrictMode>,
   );
   ```

- Extension routes are **appended after** the stock routes and nested inside the
  stock `Layout`, so they inherit the standard navbar / menu chrome. They sit
  under an error boundary (see *Failure mode*).
- If `extensionRoutes` is empty (disabled, empty folder, or every bundle failed),
  the tree rendered is **byte-for-byte today's tree** — the feature adds nothing
  to the DOM.
- `HashRouter` is retained, so an extension `path` of `/ext/reports` is reached
  at `#/ext/reports`, consistent with every stock route.
- The manifest fetch adds one round-trip before first paint. This is acceptable:
  it is a same-origin request to the local server, and the alternative (render,
  then hydrate extra routes) risks a flash of "route not found" for a
  deep-linked extension URL.

### Menu integration

**Recommendation: the SPA merges extension entries into the menu client-side,
appended after the menu-file entries; the operator edits nothing.**

Per `menu-configuration.md`, the menu is driven by a config file (SPEC-1 / #795)
served as `{ route, text }` entries (IMPL-2 / #796) and rendered by the
`LinksMenu` component family.

- After the bootstrap step resolves `extensionRoutes`, the SPA passes their
  `{ path, text }` pairs (as `{ route: path, text }`) to the menu component
  **appended after** the entries returned by the menu endpoint, preserving #796's
  order rules (defaults first, then file-order custom entries, then extension
  entries).
- The operator does **not** have to add extension routes to the menu file — they
  appear automatically. The operator **can still**:
  - hide one via a `menu.yml` entry `{ route: /ext/reports, hidden: true }` — the
    SPA drops any extension entry whose `route` matches a `hidden` menu-file
    entry (reusing #796's `hidden` lever, which #796 already defines for a
    `route` that is not a shipped default);
  - reposition one by re-listing its `route` explicitly in `menu.yml`, in which
    case #796's "duplicate `route`, first occurrence wins" rule keeps the
    file-declared position and the auto-appended copy is skipped.
- Client-side merge (not server-side) is chosen because the extension `text`
  lives in the bundle, which only the browser loads; the menu endpoint never
  imports extension JS. This keeps `source/`'s menu handler unaware of the
  frontend extension track, matching #796's "the menu file and the extra-routes
  file are separate schemas, neither validates the other".

### Asset serving

**Recommendation: a dedicated `PathValidator`-guarded handler reading straight
from `NAVI_EXTENSIONS_DIR/frontend/`. No copy into `source/static/`.**

New handler → `GET /extensions/frontend/*path`, modeled on `AssetsHandler`:

- `baseDir = path.join(ExtensionsEnv.dir, 'frontend')`.
- `rel = [].concat(req.params.path).join(path.sep)`;
  `resolved = path.resolve(baseDir, rel)`;
  `new PathValidator(baseDir).validate(resolved)` → `ForbiddenError` → **403** on
  any `..` or symlink escape (identical guard to `AssetsHandler`).
- `res.sendFile(resolved)` — Express sets `Content-Type` from the extension
  (`.js` → `text/javascript`, `.css` → `text/css`); a missing file yields
  **404** via `sendFile`'s error path, same as `AssetsHandler`.
- When `ExtensionsEnv` is **disabled**, the route is still registered but every
  request short-circuits to **404**, so a disabled deployment exposes nothing
  even if a volume is mounted.
- Registered inside `Router.build()` **after** the stock maps and **before**
  `express.static(staticDir)` / the catch-all `IndexHandler`, so `/extensions/*`
  never falls through to the SPA fallback.

A boot-time copy into `source/static/` was rejected: the global npm-install
directory may be **read-only**, the copy would need invalidating on every
container restart, and it duplicates bytes for no gain over serving them in
place.

### Enable flag on a static SPA

**Recommendation: the SPA is unconditional; the server gates by returning an
empty manifest. This resolves SPEC-3's open item.**

SPEC-3's *Build-time vs. runtime note* left open how `NAVI_EXTENSIONS_ENABLED` —
read by the backend at container runtime — reaches a Vite bundle that was built
before the container existed. Resolution:

- The SPA has **no build-time branch** and **no env access**. It always ships the
  bootstrap step and always calls `GET /extensions/frontend.json`.
- The **server** applies the flag: `frontend.json` returns `{ bundles: [] }`
  whenever `ExtensionsEnv` is disabled, and `GET /extensions/frontend/*path`
  returns 404. A disabled deployment therefore runs the exact same SPA bytes and
  simply discovers zero extensions — rendered output identical to today.
- No `index.html` templating, no `window.__NAVI_EXTENSIONS__` injection, no
  per-deployment `source/static/` variant. One built SPA serves both modes.

This is the frontend counterpart of the Backend's "loader reads `ExtensionsEnv`
and returns immediately when disabled" — the gate is server-side in both halves.

### Single React instance

**Recommendation: the constraint is fixed here — exactly one React, provided by
the host. The mechanism is an `index.html` import map plus extension bundles
built with React as externals. IMPL-4 finalises the exact map contents.**

Externally built React bundles that bundle **their own** `react` / `react-dom` /
`react-router-dom` produce a second React instance, which breaks hooks, context,
and `<Routes>` matching the moment an extension component mounts inside the host
tree.

- **Host side.** `frontend/index.html` gains an import map that points the bare
  specifiers at the host's already-bundled copies, e.g.:

  ```html
  <script type="importmap">
  {
    "imports": {
      "react": "/assets/react.<hash>.js",
      "react-dom": "/assets/react-dom.<hash>.js",
      "react-dom/client": "/assets/react-dom.<hash>.js",
      "react-router-dom": "/assets/react-router-dom.<hash>.js"
    }
  }
  </script>
  ```

  Producing stable-enough URLs for the hashed chunks (a Vite manifest lookup, a
  small plugin, or pinning these three into a named chunk) is **IMPL-4's call**.
  The fixed contract is only: *the host exposes `react`, `react-dom` (including
  `/client`), and `react-router-dom` as importable ESM, and the import map wires
  the bare specifiers to them.*
- **Extension side.** Operators build their bundle with those three as
  **externals** (`rollupOptions.external`, or `vite build --lib` with
  `external`), so `import { useState } from 'react'` in the extension resolves —
  via the import map — to the host copy at runtime.
- `React.lazy` remains available to extensions for code-splitting their own
  component; it resolves against the same single React.
- The SPEC-5 (#799) user guide
  ([`docs/guides/navi/extending-navi.md`](../../guides/navi/extending-navi.md))
  documents the "build React as external" step and carries the copy-pasteable
  Vite config snippet; the downstream-developer walkthrough is
  [`downstream-extension-workflow.md`](downstream-extension-workflow.md).

### Failure mode

**Recommendation: never white-screen. Skip-and-warn per bundle / descriptor; an
error boundary around the extension routes.** Consistent with the Backend section
and #796.

| Failure | Behaviour |
|---|---|
| `GET /extensions/frontend.json` network error, non-2xx, or unparseable JSON | treat as `{ bundles: [] }`; `console.warn`; app renders as today |
| a bundle `await import(src)` throws (syntax error, bad external, top-level throw) | `console.warn` with the `src`; skip that bundle; continue with the rest |
| `mod.default` is not an array | `console.warn`; skip that bundle |
| a descriptor is missing `path` / `text` / `component`, or `path` does not start with `/`, or `component` is not a function | `console.warn` with the bundle + index; skip that **descriptor**; keep the bundle's other descriptors |
| a route `component` throws during render | caught by `ExtensionErrorBoundary` wrapping the extension `<Route>` subtree — that route shows a small inline error, **stock UI and other extension routes unaffected** |
| a sibling `<name>.css` 404s | browser ignores the dead `<link>`; no JS impact |

The error boundary is a single component
(`frontend/src/extensions/ExtensionErrorBoundary.jsx`) wrapping only the
extension `<Route>`s, so a throwing extension page can never blank the navbar or
the stock pages. No failure path produces a white screen.

### Build/serve story

End-to-end for a downstream developer — **no derived image required for the
frontend**:

1. **Build the extension bundle.** In the operator's own project, author React
   components normally, then `vite build --lib` (or Rollup) with `react`,
   `react-dom`, and `react-router-dom` as **externals**, producing a single ESM
   `reports.js` (plus an optional `reports.css`). The entry module
   default-exports `[{ path: '/ext/reports', text: 'Reports', component: Reports }]`.
2. **Lay out the volume.**

   ```
   my-extensions/
     frontend/
       reports.js
       reports.css
   ```

   (Add `my-extensions/backend/*.js` too if the extension also needs server
   routes — same volume, see the Backend section.)
3. **Run the stock image** — no rebuild:

   ```yaml
   services:
     navi:
       image: darthjee/navi:latest
       environment:
         NAVI_EXTENSIONS_ENABLED: "true"
       volumes:
         - ./my-extensions:/navi/extensions
   ```

4. **Result.** On boot the SPA fetches `/extensions/frontend.json`, lazy-loads
   `reports.js` from `/extensions/frontend/reports.js`, mounts `#/ext/reports`
   inside the stock layout, and appends a **Reports** entry to the menu. With
   `NAVI_EXTENSIONS_ENABLED` unset the same image serves the same SPA with no
   extension routes and no menu entry.
5. **Lifecycle.** Like the Backend, extension bundles are discovered at SPA boot
   (page load). Changing a bundle takes effect on the next full page load; there
   is no hot-reload. `PATCH /engine/reload` does not affect extensions.

This is the concrete input to SPEC-5 (#799) —
[`downstream-extension-workflow.md`](downstream-extension-workflow.md) and the
[`docs/guides/navi/extending-navi.md`](../../guides/navi/extending-navi.md)
guide — which turn it into user-facing docs and reuse the route names
(`/extensions/frontend.json`, `/extensions/frontend/*`) and the env / volume names
fixed in the Shared contract.

### Deferred / out of scope

Same posture as the Backend's deferred list. Each gets its own
`docs/agents/future/` note and issue under #794 only if genuinely needed:

- recursive `frontend/` subdirectories;
- a build-time SPA-rebuild path or SSR for extensions;
- npm-dependency installation for extension bundles (they may import only what
  the image ships — via the import map — plus their own bundled code);
- per-extension permissioning or sandboxing of extension components;
- hot-reload / re-scan of `frontend/` without a page reload;
- extension-controlled placement within the menu beyond #796's `hidden` /
  re-list levers (icons, groups, submenus — already deferred by #796).

---

## Cross-references

- **#794** — umbrella issue for the menu + extension tracks.
- **Shared contract** (above) — consumed by both the Backend and the Frontend
  sections.
- **SPEC-4 (#798)** — the frontend half; added the [`## Frontend`](#frontend)
  section above, built on the Shared contract.
- **SPEC-5 (#799)** — the downstream-developer view, split across the transient
  [`downstream-extension-workflow.md`](downstream-extension-workflow.md) (project
  layout, build tooling, image/compose wiring, worked example, upgrade checklist)
  and the permanent guide
  [`docs/guides/navi/extending-navi.md`](../../guides/navi/extending-navi.md) (the
  security warning, the reload limitation, and the copy-pasteable external-React
  build snippet). Both reuse the env / volume names fixed above, the
  `/extensions/frontend.json` + `/extensions/frontend/*` route names, and the
  descriptor shapes from the Backend and Frontend sections. SPEC-5 also settles
  the canonical backend handler base-class import specifier
  (`navi-hey/extension`).
- **IMPL-3 (#803)** — implements the Backend section.
- **IMPL-4 (#804)** — implements the Frontend section; spans `frontend/` and
  `source/`.
- **#795 / #796** — the menu track; shares the "mounted file, operator-controlled
  trust boundary" language. The Frontend section's *Menu integration* merges
  extension entries into #796's menu output client-side.
- **CLEAN-1 (#807)** — deletes this document once the feature ships, folding the
  durable parts into `docs/agents/web-server.md` / `docs/agents/frontend.md`.
</content>
</invoke>

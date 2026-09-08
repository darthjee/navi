# Plan: SPEC: backend extra-route extension mechanism

Issue: [797-spec-backend-extra-route-extension-mechanism.md](../issues/797-spec-backend-extra-route-extension-mechanism.md)

## Overview

Specification/documentation issue in the **extension track** of #794. The
deliverable is prose only: a new architecture document
`docs/agents/future/extension-architecture.md` with a **Shared contract** section
(inherited by SPEC-4 / #798) and a **Backend** section. No production code, no
tests. The document is transient and is removed by CLEAN-1 (#807) once the feature
ships, with anything lasting folded into `docs/agents/web-server.md`.

Every design decision is already settled on the issue (see its `## Solution`);
this plan captures them precisely, grounded in the current server code, so that
IMPL-3 (#803) can be built and tested without re-deciding anything.

## Context

### Settled decisions (from the issue)

- **Config surface**: env-only. `NAVI_EXTENSIONS_ENABLED` (truthy required, default
  off) + `NAVI_EXTENSIONS_DIR` (default `/navi/extensions`). No `web.*` YAML key,
  no `WebConfig` field. Read via a small dedicated `ExtensionsEnv` resolver
  (precedent: `BaseLogger` reading `process.env.LOG_LEVEL`).
- **Mounted-folder layout**: one volume at `NAVI_EXTENSIONS_DIR` with `backend/`
  and `frontend/` subtrees. Backend modules are the ESM `.js` files directly under
  `backend/`.
- **Route declaration**: modules self-declare — each `backend/*.js` exports (default
  or named `routes`) an array of `{ method, path, handler }` descriptors;
  `handler` is a `RequestHandler` subclass. No manifest anywhere; `Logger.info`
  prints the loaded route table at boot.
- **Loading**: dynamic `import()` during `Router.build()`, registered through the
  existing `RouteRegister`, before `express.static` + the catch-all.
- **Error handling**: skip-and-warn per module (`Logger.warn`); enabled-but-missing
  or non-directory `NAVI_EXTENSIONS_DIR` is a fail-fast startup error.
- **Security**: operator-controlled trust boundary (same as the navi YAML and the
  mounted menu file), explicitly not sandboxed, `PathValidator`-bounded resolution
  under `<dir>/backend`, single opt-in env flag, explicit "arbitrary mounted code"
  warning in the user guide.
- **Collision**: stock routes always win (extra skipped + warn); between two extras
  first loaded wins (second skipped + warn).
- **Reload**: `PATCH /engine/reload` does not re-scan; ESM modules are process-
  cached; new/changed extension code needs a container restart. Documented
  limitation.

### Current server code the doc must reference (verified this session)

- `source/lib/server/Router.js` — `build()` builds a fresh Express Router + a
  `RouteRegister`, iterates `GET_ROUTES` / `PATCH_ROUTES` / `POST_ROUTES`
  (`path → HandlerConfig`), then `router.use(express.static(staticDir))` and a
  final catch-all `IndexHandler`. Extra routes must be registered inside `build()`
  after the stock maps but before the `express.static` / catch-all lines.
- `source/lib/server/RouteRegister.js` — `register` (GET, sync),
  `registerPatch` / `registerPost` (async, `await`ed). All wrap
  `handler.handle(req, res)` in try/catch mapping `ConflictError → 409`,
  `ForbiddenError → 403`, `NotFoundError → 404`, else → 500, and `Logger.debug`
  the access line.
- `source/lib/common/server/HandlerConfig.js` — `new HandlerConfig(Class, params)`;
  `handle(req, res)` does `new Class(req, res, ...params).handle()` per request.
- `source/lib/common/server/RequestHandler.js` — base class, no-op `handle()`;
  every stock handler under `source/lib/server/handlers/` extends it.
- `source/lib/server/WebServer.js` — constructor does
  `this.#app.use(new Router({ webConfig }).build())` once; `WebServer.build()`
  returns `null` when there is no `webConfig`.
- `source/lib/server/PathValidator.js` — `isValid(resolved)` is
  `resolved.startsWith(baseDir + path.sep)`; `validate()` throws `ForbiddenError`.
  Used by `AssetsHandler` with `path.resolve(baseDir, rel)`.
- `source/lib/services/engine/EngineController.js` — `reload()` calls
  `reloadConfig()` (`NamespaceMap.include(ConfigIncluder.resolve(entryFilePath))`)
  and restarts the engine; the running `WebServer` / `Router` are not rebuilt.
- `source/lib/common/utils/logging/BaseLogger.js` — reads `process.env.LOG_LEVEL`
  directly: the precedent for an env-only config read.
- Conventions (`docs/agents/architecture/style-and-tooling.md`): ESM only, `.js`
  extensions, dynamic `import()` (no `require`), `console` limited to
  `warn`/`error` (use `Logger`), max file length 300 lines, max complexity 10.

### Coordination

- **SPEC-4 (#798)** consumes the Shared contract section verbatim. It is not yet
  written. This doc must define the shared contract completely and flag the one
  open asymmetry for SPEC-4: the backend reads `NAVI_EXTENSIONS_*` at runtime, but
  the frontend is a Vite build — SPEC-4 decides how `frontend/` and the enable
  flag reach the SPA at build/serve time.
- **SPEC-5 (#799)** and the Dockerfiles reference the volume target
  (`/navi/extensions`) and the two env var names.

## Implementation Steps

### Step 1 — Create the document and write the Shared contract section

Create `docs/agents/future/extension-architecture.md`:

- Intro: what the extension mechanism is, that it is opt-in and off by default,
  that this file is a transient design doc (removed by CLEAN-1 / #807), and a
  pointer to IMPL-3 (#803) as the backend implementation issue.
- `## Shared contract` section, the single source of truth SPEC-4 links to:
  - **Environment variables** — `NAVI_EXTENSIONS_ENABLED` (truthy values accepted;
    default off; nothing loads unless truthy) and `NAVI_EXTENSIONS_DIR` (default
    `/navi/extensions`). State that the navi YAML is deliberately untouched and
    why (enable decision is a container/deploy concern, not versioned app config).
  - **Mounted-folder layout** — one mount at `NAVI_EXTENSIONS_DIR` containing
    `backend/` and `frontend/`. Describe how `backend/` is scanned (flat `.js`
    files, ESM). Leave `frontend/` layout to SPEC-4 but reserve the subtree name.
  - **Volume / naming** — the compose volume target (`/navi/extensions`) and the
    two env var names, called out as the names SPEC-4, SPEC-5 (#799) and the
    Dockerfiles must all use.
  - **Build-time vs runtime note** — the explicit open item for SPEC-4 described
    under "Coordination" above.

### Step 2 — Write the Backend section and cross-link

Add `## Backend` to the same file, one subsection per issue bullet, each ending on
the settled recommendation:

- **Route declaration & module contract** — `backend/*.js` exports an array of
  `{ method, path, handler }`; `method` is one of GET/PATCH/POST (match the three
  stock maps); `path` is an absolute route string; `handler` is a
  `RequestHandler` subclass instantiated per request exactly like stock handlers.
  Spell out the guarantees the handler inherits from `RouteRegister`: GET runs
  sync, PATCH/POST are awaited, and throwing `ConflictError` / `ForbiddenError` /
  `NotFoundError` yields 409 / 403 / 404 while any other throw yields 500. Give a
  minimal example module.
- **Loading mechanism** — a loader (sketch: `ExtensionRoutesLoader`) invoked from
  `Router.build()`: read `ExtensionsEnv`; if disabled, no-op; else resolve
  `<dir>/backend`, `PathValidator`-check each file path, `await import()` each,
  collect descriptors, and feed them through `register` / `registerPatch` /
  `registerPost` before the `express.static` / catch-all lines. `Logger.info` the
  resulting route table.
- **Error handling** — per-module `try/catch` around `import()` and descriptor
  validation: on failure `Logger.warn` with the file path and reason, skip that
  module, continue. `NAVI_EXTENSIONS_ENABLED` truthy while `NAVI_EXTENSIONS_DIR`
  is unset / missing / not a directory: throw at startup (fail-fast), matching
  `ConfigLoader`'s posture for a broken config root.
- **Security model** — trust boundary identical to the navi YAML and the mounted
  menu file (operator owns both the image env and the volume contents); explicitly
  not sandboxed and not resource-limited; `PathValidator` only prevents escaping
  `<dir>/backend`, nothing more; the opt-in flag is the primary control; the user
  guide must carry a plain-language "you are running arbitrary code you mounted"
  warning. Note `SecuredRequestHandler` is available to extension authors who want
  a token-gated route, but extras are public by default like the monitoring routes.
- **Collision handling** — before registering an extra route, check its
  `method + path` against the stock maps and against already-registered extras:
  stock wins (skip + `Logger.warn`); earlier extra wins (skip + `Logger.warn`).
  Never abort for a collision.
- **Config plumbing & reload** — `ExtensionsEnv` is a tiny resolver read inside
  `Router.build()`; no change to `WebConfig` / `ConfigParser` / the `webConfig`
  argument. `PATCH /engine/reload` re-reads YAML and restarts the engine only —
  the `WebServer`/`Router` are not rebuilt, so extensions are fixed for the
  process lifetime; picking up changes needs a container restart. Record as a
  known limitation with a one-line rationale (ESM module cache + smaller blast
  radius).

Then:

- Cross-link: SPEC-4 (#798) → "see Shared contract above"; IMPL-3 (#803) as the
  implementer; CLEAN-1 (#807) as the removal issue.
- Reconcile naming with the menu specs (#795/#796) where they overlap (the
  "mounted file / operator-controlled trust boundary" language).
- Verify the issue's acceptance criteria: file exists with a backend section
  covering every bullet; shared contract written once and referenced by SPEC-4;
  concrete recommendation for loading mechanism and enable flag; IMPL-3 needs no
  further decisions.

## Files to Change

- `docs/agents/future/extension-architecture.md` — **new**. Shared contract
  section + Backend section, per the steps above. SPEC-4 (#798) will later append
  a Frontend section to this same file.

## Notes

- Pure documentation under `docs/agents/future/`. No code, no specs, no build. No
  CI job covers `docs/**` (CI is per-code-folder lint + jasmine), so there are no
  CI checks for this issue.
- No agent split: authoring a `docs/agents/future/` architecture doc is the
  architect's scope; no `.claude/agents` specialist owns that path. Engine/docker
  input is advisory only and already captured in the settled decisions.
- Ordering: this issue creates the file SPEC-4 (#798) extends; ideally #797 lands
  first. Nothing blocks #797 itself.
- Keep the Backend and Shared contract sections self-contained so CLEAN-1 (#807)
  can move the durable parts into `docs/agents/web-server.md` mechanically.
- Do not expand scope: no YAML config key, no manifest file, no sandboxing design,
  no hot-reload of extensions. If authoring surfaces a genuine new concern, raise
  it as a comment on #794.

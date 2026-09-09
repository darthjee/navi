# Issue: Frontend: load and register extra pages/routes from a mounted folder

## Description

IMPL-4 of the **extension track** of #794. Implements the `## Frontend` section of
`docs/agents/future/extension-architecture.md` (written by SPEC-4 / #798) with no
further design decisions expected beyond the two called out under *Solution*.

The stock frontend is a Vite + React 19 SPA. `frontend/src/main.jsx` renders a
`HashRouter` with a literal `<Routes>` list; pages are static imports from
`frontend/src/components/pages/`. `scripts/ci/build-frontend.sh` runs `yarn build`
and copies `frontend/dist/.` into `source/static/` at npm-publish / image-build
time. The production image ships neither the frontend source nor the Vite
toolchain. `source/lib/server/Router.js` `build()` serves that static bundle
(`express.static`, `GET /assets/*path` via `AssetsHandler`, catch-all
`IndexHandler`). There is no runtime module loading in the SPA today.

The backend half (IMPL-3 / #803) already shipped the shared plumbing this issue
builds on:

- `source/lib/server/extensions/ExtensionsEnv.js` — the single resolver for
  `NAVI_EXTENSIONS_ENABLED` (truthy `1|true|yes|on`, default off) and
  `NAVI_EXTENSIONS_DIR` (default `/navi/extensions`). The frontend handlers read
  this same resolver, not a second env mechanism.
- The mounted volume at `NAVI_EXTENSIONS_DIR` with reserved `backend/` and
  `frontend/` subtrees; `docker-compose.yml` already carries the volume example
  and `dockerfiles/production_navi_hey/Dockerfile` the env defaults.
- Extra routes register inside `Router.build()` after the stock maps and before
  `express.static` / the catch-all — the new frontend handlers follow the same
  rule.

The menu is config-driven as of IMPL-1 / IMPL-2 (#801 / #802): `GET /menu.json`
serves `{ entries: [{ route, text }] }` from a dedicated config file, consumed by
`MenuClient` → `MenuMenu` on the frontend.

## Problem

A product built on the stock Navi image can now add its own backend route
handlers (IMPL-3) but still cannot add its own dashboard pages/routes without
forking. The SPA is a pre-built bundle shipped inside the npm package and the
image carries no build toolchain, so "rebuild the SPA with the extension's
source" is not a viable downstream operation.

## Expected Behavior

Per SPEC-4, with every extension bundle being a **pre-built ESM module mounted at
runtime** — no SPA rebuild, no toolchain in the derived image:

- **`frontend/` layout** — flat, non-recursive. Each `NAVI_EXTENSIONS_DIR/frontend/*.js`
  is a candidate bundle whose default export is an array of
  `{ path, text, component }` descriptors (`path` a non-empty `/`-prefixed string
  with no whitespace; `text` a non-empty string; `component` a React
  component, possibly `React.lazy`). Optional sibling `<name>.css` loaded with the
  bundle. Enumeration is lexicographic by filename.
- **Discovery** — a new handler serves `GET /extensions/frontend.json`. Reads
  `ExtensionsEnv`; when disabled or `frontend/` is absent/not a directory,
  responds `200 { "bundles": [] }` (never 404). Otherwise enumerates
  `frontend/*.js` and responds
  `{ "bundles": [{ "src": "/extensions/frontend/<name>.js", "css"?: "/extensions/frontend/<name>.css" }] }`.
  The manifest carries no route/menu data — the folder is the source of truth.
- **Asset serving** — a new handler serves `GET /extensions/frontend/*path`,
  modeled on `AssetsHandler`:
  `baseDir = path.join(ExtensionsEnv.dir, 'frontend')`,
  `path.resolve` + `new PathValidator(baseDir).validate(resolved)` →
  `ForbiddenError` → 403 on any traversal/symlink escape, `res.sendFile` (missing
  file → 404). When `ExtensionsEnv` is disabled the route is still registered but
  every request short-circuits to 404. Registered inside `Router.build()` after
  the stock maps and before `express.static` / catch-all.
- **Router wiring** — `frontend/src/main.jsx` becomes a thin async bootstrap
  (delegating to `frontend/src/extensions/loadExtensions.js`) that runs before
  `createRoot`: fetch `/extensions/frontend.json`; for each bundle in manifest
  order, inject the `<link>` if `css` is set, `await import(/* @vite-ignore */ src)`,
  validate `mod.default`, collect surviving descriptors. Render once, appending
  the extension `<Route>`s **after** the stock routes, nested inside the stock
  `Layout`, wrapped in `frontend/src/extensions/ExtensionErrorBoundary.jsx`. When
  no descriptors survive (disabled, empty folder, all bundles failed) the rendered
  tree is byte-for-byte today's tree.
- **Menu integration** — after bootstrap resolves the descriptors, the SPA merges
  their `{ route: path, text }` into the menu, appended after the `/menu.json`
  entries, **deduped by `route`** (an extension `route` already present in the
  `/menu.json` response is not appended again, so re-listing it in the menu file
  repositions it). The operator does not otherwise edit the menu file for
  extension routes. To make "hide an extension route" work, `/menu.json` is
  extended to surface `hidden` entries whose `route` is not a shipped default so
  the SPA can filter its extension merge against them (see *Solution* — this
  reopens IMPL-2 / #802 code).
- **Dev environment** — extension loading is only guaranteed against the
  Express-served build (the production image). The Vite dev server (`dev/`,
  port 8080) does not serve `/extensions/*`; wiring a dev-server proxy is out of
  scope for this issue and left as a follow-up.
- **Enable flag on a static SPA** — the SPA is unconditional and has no env
  access; the server gates by returning an empty manifest / 404 when
  `ExtensionsEnv` is disabled. One built SPA serves both modes.
- **Single React instance** — `frontend/index.html` gains an import map wiring
  `react`, `react-dom`, `react-dom/client`, and `react-router-dom` to the host's
  already-bundled copies; extension bundles are built with those three as
  externals. Exactly one React instance, provided by the host.
- **Failure mode** — never white-screen. Manifest fetch/parse error → treat as
  `{ bundles: [] }` + `console.warn`. A bundle that fails to `import()` or whose
  `default` is not a valid descriptor array → `console.warn`, skip that bundle /
  descriptor, continue. A route component that throws at render → caught by
  `ExtensionErrorBoundary`; stock UI and other extension routes unaffected.
- **Compose example** — extend `docker-compose.yml` (comment or sample) to show a
  `frontend/` extension bundle mounted alongside the existing `backend/` example
  from IMPL-3, so the mounted-folder story covers both halves.
- **Tests** — `frontend/spec/` coverage (reusing `spec/support`) for a loaded
  extension page rendering at its route and surfacing in the menu, and for each
  failure mode; `source/spec/` coverage for the two new handlers (manifest
  enabled/disabled/missing-dir, asset serving, traversal → 403, missing → 404,
  disabled → 404) and for the extended `/menu.json` hidden-entry behaviour.
- **Docs** — update `docs/agents/frontend.md` (and any durable web-server notes),
  plus `docs/agents/future/menu-configuration.md` for the `hidden`-on-non-default
  change. The user-facing guide `docs/guides/navi/extending-navi.md` is
  IMPL-5 (#805).

## Acceptance criteria

- [ ] A mounted extension page renders at its configured route.
- [ ] Its `{ route, text }` entry appears in the menu.
- [ ] Stock routes and pages are unaffected when no extension is mounted
      (rendered tree unchanged).
- [ ] `GET /extensions/frontend.json` returns `{ bundles: [] }` when extensions
      are disabled or `frontend/` is absent.
- [ ] `GET /extensions/frontend/*path` is `PathValidator`-guarded (403 on
      traversal, 404 on missing / when disabled).
- [ ] A failed/malformed extension load is isolated, `console.warn`-ed, and never
      white-screens.
- [ ] Extension bundles resolve `react` / `react-dom` / `react-router-dom` to the
      single host instance via the `index.html` import map.
- [ ] `yarn lint` / `yarn test` pass in `frontend/`; `source/` specs pass.
- [ ] `docs/agents/frontend.md` updated.

## Solution

The SPEC-4 positions above are settled. Two points are resolved for this issue as
follows:

1. **Import-map URL production — pin the three into a fixed-name chunk.**
   `frontend/vite.config.js` gets `rollupOptions.output.manualChunks` grouping
   `react`, `react-dom`, `react-dom/client`, and `react-router-dom` into one
   chunk, with a `chunkFileNames` callback emitting that chunk at a literal,
   unhashed path (e.g. `assets/react-vendor.js`). `frontend/index.html` then
   carries a static import map mapping the four bare specifiers to that path.
   This keeps `IndexHandler` fully static (no runtime templating) and needs no
   build plugin; staleness across Navi upgrades is a non-issue because
   `express.static` serves the chunk with ETag / conditional-request revalidation
   (no long-lived `max-age`), so a changed React bundle is refetched. Fallback if
   pinning the chunk name proves fragile with the React 19 +
   `babel-plugin-react-compiler` setup: a small post-build Vite plugin that reads
   the build manifest and injects the import map with the real hashed filenames
   into `index.html`.

2. **Menu hide / reposition — extend `/menu.json` to surface hidden non-default
   entries.** SPEC-4's *Menu integration* assumes the `hidden` lever works on
   non-default routes and is visible to the SPA, but IMPL-2 (#802) shipped
   `hidden` as **server-side only, known-default routes only** — `hidden: true`
   on a non-default `route` is skipped with a warning
   (`source/lib/models/configs/MenuConfig.js`) and `hidden` is never serialized
   (`MenuEntry.toJSON` / `MenuSerializer`). This issue changes that: `MenuConfig`
   keeps `hidden: true` non-default entries instead of discarding them, and
   `MenuHandler` / `MenuSerializer` emit them in the `/menu.json` response as a
   separate list (e.g. `{ entries: [...], hidden: ["/ext/reports"] }`) that
   carries no `text`. The SPA drops any extension descriptor whose `route`
   appears in that list, and dedupes the rest by `route` against `entries` (so
   re-listing an extension `route` in the menu file repositions it and the
   auto-append is skipped). Touches `MenuConfig.js`, `MenuEntry.js`,
   `MenuSerializer.js`, `MenuHandler.js` + specs, and
   `docs/agents/future/menu-configuration.md`.

## Benefits

- IMPL-4 gets one settled strategy, a bundle contract, a discovery endpoint, an
  asset route, and a failure policy from SPEC-4.
- The derived-image story stays as light as the backend's: mount a volume, set
  one env var, no frontend toolchain, no SPA rebuild.
- Reuses existing precedents — `AssetsHandler` + `PathValidator` for serving,
  `React.lazy` for code-splitting, the `/menu.json` endpoint for entries — instead
  of new machinery.
- Keeps the frontend and backend extension contracts symmetric (flat folder,
  self-declaring modules, boot/serve-time discovery, skip-and-warn), so SPEC-5
  (#805) documents one mental model.

## Dependencies

Depends on **SPEC-4** (#798, merged). Builds on **IMPL-3** (#803, merged), which
owns the shared `NAVI_EXTENSIONS_ENABLED` / `NAVI_EXTENSIONS_DIR` resolver, the
mounted-folder contract, and the `docker-compose.yml` / Dockerfile wiring. Feeds
**IMPL-5** (#805) and **IMPL-6** (#806).

## Agents

frontend, engine, docker.

- **frontend** — the async bootstrap / `loadExtensions.js`, `ExtensionErrorBoundary`,
  router wiring in `main.jsx`, the `index.html` import map, the `vite.config.js`
  `manualChunks` change, the client-side menu merge, and `frontend/spec/`
  coverage.
- **engine** — the two new `source/` handlers
  (`GET /extensions/frontend.json`, `GET /extensions/frontend/*path`) wired into
  `Router.build()`, the `/menu.json` extension to surface hidden non-default
  entries (`MenuConfig` / `MenuEntry` / `MenuSerializer` / `MenuHandler`), and
  `source/spec/` coverage.
- **docker** — the `docker-compose.yml` `frontend/` bundle mount example.

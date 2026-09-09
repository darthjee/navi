# Plan: Frontend: load and register extra pages/routes from a mounted folder

Issue: [804-frontend-load-and-register-extra-pages-routes-from-a-mounted-folder.md](../../issues/804-frontend-load-and-register-extra-pages-routes-from-a-mounted-folder.md)

## Overview

IMPL-4 of #794's extension track. The running SPA gains the ability to discover
and lazy-load **pre-built ESM extension bundles** mounted under
`NAVI_EXTENSIONS_DIR/frontend/` — no SPA rebuild, no toolchain in the derived
image, symmetric with the backend loader from IMPL-3 (#803). The server grows two
new routes (`GET /extensions/frontend.json` manifest, `GET /extensions/frontend/*path`
asset) that read the same `ExtensionsEnv` resolver and gate on
`NAVI_EXTENSIONS_ENABLED`; the SPA bootstraps asynchronously, merges each bundle's
`{ path, text, component }` descriptors into the router after the stock routes
under an error boundary, and appends them to the menu client-side. Single React
instance is guaranteed by an `index.html` import map backed by a fixed-name Vite
vendor chunk. `/menu.json` is extended to surface `hidden` non-default routes so
an operator can hide an extension route.

## Agents involved

- [engine](engine.md) — the two new `source/` handlers + `Router.build()` wiring,
  `ExtensionsEnv.frontendDir`, the `/menu.json` `hidden` extension, `web-server.md`.
- [frontend](frontend.md) — the async bootstrap, `loadExtensions.js`,
  `ExtensionErrorBoundary`, `main.jsx` router wiring, the `vite.config.js` +
  `index.html` import-map change, the client-side menu merge, `frontend/spec/`
  coverage, `frontend.md`.
- [docker](docker.md) — the `docker-compose.yml` `frontend/` bundle mount example.

## Shared contracts

### 1. Manifest endpoint — `GET /extensions/frontend.json` (engine → frontend)

- Reads `ExtensionsEnv`. When `!enabled`, or `NAVI_EXTENSIONS_DIR/frontend/` is
  absent / not a directory → `200 { "bundles": [] }`. **Never 404.**
- Otherwise enumerate `frontend/*.js` (flat, non-recursive, `fs.readdirSync` →
  `.filter(f => f.endsWith('.js'))` → `.sort()` for lexicographic order) and
  respond:

  ```json
  {
    "bundles": [
      { "src": "/extensions/frontend/audit.js", "css": "/extensions/frontend/audit.css" },
      { "src": "/extensions/frontend/reports.js" }
    ]
  }
  ```

  - `src` — always present, the asset-route URL for the `.js` bundle.
  - `css` — present **only** when a sibling `<name>.css` exists in `frontend/`.
- Carries **no** route / menu / component data — the bundle itself is the source
  of truth (mirrors the backend's module-is-truth rule).
- `Content-Type: application/json`.

### 2. Asset endpoint — `GET /extensions/frontend/*path` (engine → frontend / operator)

- `baseDir = ExtensionsEnv.frontendDir` (= `path.join(ExtensionsEnv.dir, 'frontend')`).
- `rel = [].concat(req.params.path).join(path.sep)` →
  `resolved = path.resolve(baseDir, rel)` →
  `new PathValidator(baseDir).validate(resolved)` (throws `ForbiddenError` →
  **403** via `RouteRegister`) → `res.sendFile(resolved)` (missing file → **404**
  through `sendFile`'s error path, same as `AssetsHandler`).
- When `ExtensionsEnv` is **disabled** the route is still registered but every
  request short-circuits to **404** (`throw new NotFoundError()` before touching
  the filesystem).
- Express sets `Content-Type` from the file extension (`.js` → `text/javascript`,
  `.css` → `text/css`).
- Registered inside `Router.build()` **after** the stock GET map and **before**
  `express.static(staticDir)` / the catch-all `IndexHandler`.

### 3. Bundle descriptor contract (operator → frontend; frontend validates)

Each `frontend/*.js` **default-exports an array** of descriptors:

| Field | Required | Constraint (frontend validation) |
|---|---|---|
| `path` | yes | `typeof === 'string'`, non-empty, starts with `/`, no whitespace |
| `text` | yes | `typeof === 'string'`, non-empty |
| `component` | yes | `typeof === 'function'` (function or class component; may be `React.lazy(...)`) |

`mod.default` not an array → skip the whole bundle + `console.warn`. A single bad
descriptor → skip that descriptor, keep the rest + `console.warn`.

### 4. Menu response extension — `GET /menu.json` (engine → frontend)

Response shape becomes:

```json
{
  "entries": [ { "route": "/logs", "text": "Logs" } ],
  "hidden": [ "/ext/reports" ]
}
```

- `entries` — unchanged from IMPL-2 (visible `{ route, text }` in render order).
- `hidden` — **new**, always present (possibly `[]`). An array of `route`
  strings: the menu-file entries carrying `hidden: true` whose `route` is **not**
  a shipped default (`/logs`, `/memory/status`). Shipped-default `hidden` entries
  keep their existing behaviour (suppressed from `entries`, **not** listed here).
- Frontend menu merge, after `/menu.json` resolves and the bootstrap resolves the
  extension descriptors: append `{ route: d.path, text: d.text }` for each
  surviving descriptor **after** `entries`, skipping any whose `d.path` is in
  `hidden` **or** already present as a `route` in `entries` (dedupe by route — so
  re-listing an extension route in the menu file repositions it and the
  auto-append is skipped).

### 5. Single React instance / import map (frontend-internal; feeds SPEC-5)

- `frontend/vite.config.js` groups `react`, `react-dom`, `react-dom/client`,
  `react-router-dom` into one chunk via `build.rollupOptions.output.manualChunks`
  and emits it at a **literal, unhashed** path (`assets/react-vendor.js`) via a
  `chunkFileNames` callback (only that chunk is special-cased; everything else
  keeps `assets/[name]-[hash].js`).
- `frontend/index.html` gains
  `<script type="importmap">{ "imports": { "react": "/assets/react-vendor.js",
  "react-dom": "/assets/react-vendor.js", "react-dom/client": "/assets/react-vendor.js",
  "react-router-dom": "/assets/react-vendor.js" } }</script>` before the module
  entry `<script>`.
- Operators build extension bundles with those three packages as **externals**;
  at runtime the bare specifiers resolve through the import map to the single host
  copy. (The copy-pasteable operator build snippet is IMPL-5 / #805's guide, not
  this issue.)
- Fallback if pinning the chunk name proves fragile with React 19 +
  `babel-plugin-react-compiler`: a small post-build Vite plugin that reads the
  generated build manifest and injects the import map with the real hashed
  filenames into `index.html`.

### 6. Env / volume (fixed by IMPL-3 — docker consumes)

- `NAVI_EXTENSIONS_ENABLED` — truthy `1|true|yes|on`, default off.
- `NAVI_EXTENSIONS_DIR` — default `/navi/extensions`.
- One mounted volume with reserved `backend/` and `frontend/` subtrees. The
  `docker-compose.yml` example mounts
  `./docker_volumes/extensions:/navi/extensions`.

## CI Checks

- `source`: `cd source && npm run coverage` (CI job: `jasmine`); `cd source && npm run lint` (CI job: `checks`)
- `frontend`: `cd frontend && npm run coverage` (CI job: `jasmine-frontend`); `cd frontend && yarn lint` (CI job: `checks-frontend`)
- `docker-compose.yml` — no dedicated CI job; `docker compose config` locally to validate.

## Notes

- **Async boot regression risk.** `main.jsx` currently calls `createRoot().render()`
  synchronously at module load. It becomes `async` (awaits `/extensions/frontend.json`
  before the single `render`). Every existing `main.jsx` behaviour must be
  preserved for the empty-manifest case — the rendered tree is byte-for-byte
  today's tree when no descriptors survive. Consider a short fetch timeout so a
  hung manifest request cannot block first paint indefinitely (treat timeout as
  `{ bundles: [] }`).
- **`/* @vite-ignore */`** is required on the dynamic `import(src)` so Vite does
  not try to resolve the runtime URL at build time.
- **Reopening IMPL-2 (#802) code.** The `/menu.json` `hidden` change modifies
  `MenuConfig`, `MenuEntry`, `MenuHandler` and their specs, plus
  `docs/agents/future/menu-configuration.md`. Existing specs asserting the
  "`hidden` on a non-default route is dropped with a warning" behaviour must be
  updated to the new "kept and surfaced in `hidden[]`" behaviour.
- **Dev-server (Vite) support is out of scope.** Extension loading is only
  guaranteed against the Express-served build. Wiring a `frontend/vite.config.js`
  dev proxy for `/extensions/*` is a follow-up (would pull in the `dev` agent).
- **No `source/static/` copy.** The asset handler serves straight from the
  mounted folder — the npm-install dir may be read-only.
- IMPL-6 (#806) provides the downstream Jasmine harness; this issue's tests only
  cover Navi's own `frontend/spec/` and `source/spec/`.

# Frontend Plan: Frontend: load and register extra pages/routes from a mounted folder

Main plan: [plan.md](plan.md)

## Shared contracts

This agent **relies on** (produced by `engine`):

- **`GET /extensions/frontend.json`** — shared contract #1. `{ bundles: [{ src, css? }] }`,
  `{ bundles: [] }` when disabled / no folder, never 404. Order is significant
  (lexicographic by filename).
- **`GET /extensions/frontend/*path`** — shared contract #2. Serves the bundle
  `.js` / `.css` from the mounted folder. 404 when disabled.
- **`GET /menu.json`** — shared contract #4. Now `{ entries, hidden }`; `hidden`
  is an always-present array of route strings to exclude from the extension menu
  merge.

This agent **produces / owns**:

- **Bundle descriptor contract** — shared contract #3. Default export = array of
  `{ path, text, component }`; validation + skip-and-warn rules live here.
- **Import map / single React instance** — shared contract #5. `vite.config.js`
  `manualChunks` + fixed `chunkFileNames`; `index.html` importmap for `react`,
  `react-dom`, `react-dom/client`, `react-router-dom`.
- **Client-side menu merge** — append surviving descriptors' `{ route, text }`
  after `/menu.json` `entries`, dedupe by route, drop routes present in `hidden`.

## Steps

- [01 — `vite.config.js` vendor chunk + `index.html` import map](frontend/01-import-map-vendor-chunk.md)
- [02 — `src/extensions/loadExtensions.js` (fetch + import + validate)](frontend/02-load-extensions-module.md)
- [03 — `src/extensions/ExtensionErrorBoundary.jsx`](frontend/03-error-boundary.md)
- [04 — `src/main.jsx` async bootstrap + router wiring](frontend/04-main-jsx-bootstrap.md)
- [05 — Client-side menu merge](frontend/05-menu-merge.md)
- [06 — `frontend/spec/` coverage](frontend/06-specs.md)
- [07 — Update `docs/agents/frontend.md`](frontend/07-docs-frontend.md)

## CI Checks

- `frontend`: `cd frontend && npm run coverage` (CI job: `jasmine-frontend`)
- `frontend`: `cd frontend && yarn lint` (CI job: `checks-frontend`)

## Notes

- `main.jsx` currently renders synchronously at module load. Making it `async`
  must not change the rendered tree for the no-extensions case (empty manifest,
  fetch failure, disabled) — it must stay byte-for-byte today's tree.
- Add a short timeout (e.g. `AbortController`, ~2 s) around the manifest fetch so
  a hung request cannot block first paint; timeout → treat as `{ bundles: [] }`.
- `import(/* @vite-ignore */ src)` — the comment is required so Vite does not try
  to bundle the runtime URL.
- No new runtime dependency. `React.lazy` / `Component`, `HashRouter`,
  `<Route>` are already present.
- eslint: the project uses `eslint-config-standard` + react/hooks/promise
  plugins. Keep the controller/helper class split convention used across
  `src/components/elements/`.

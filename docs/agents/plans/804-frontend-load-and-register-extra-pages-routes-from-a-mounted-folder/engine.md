# Engine Plan: Frontend: load and register extra pages/routes from a mounted folder

Main plan: [plan.md](plan.md)

## Shared contracts

This agent **produces**:

- **Manifest endpoint** `GET /extensions/frontend.json` — shared contract #1.
  Empty `{ "bundles": [] }` when disabled / no `frontend/` dir; never 404.
  Enumerates `frontend/*.js` flat + lexicographic; each entry `{ src, css? }`.
- **Asset endpoint** `GET /extensions/frontend/*path` — shared contract #2.
  `ExtensionsEnv.frontendDir` base, `PathValidator` guard (403), missing → 404,
  disabled → 404. Registered after the stock GET map, before `express.static`.
- **`/menu.json` `hidden` key** — shared contract #4. `{ entries, hidden }`;
  `hidden` is an always-present array of non-default `route` strings carrying
  `hidden: true` in the menu file.

This agent **relies on**: `ExtensionsEnv` (from IMPL-3), `PathValidator`,
`RouteRegister` error mapping (`ForbiddenError` → 403, `NotFoundError` → 404),
`HandlerConfig` / `RequestHandler` handler-construction convention, and
`STOCK_ROUTE_KEYS` (drift-guarded).

## Steps

- [01 — Add `ExtensionsEnv.frontendDir`](engine/01-extensions-env-frontend-dir.md)
- [02 — `FrontendManifestHandler` (`GET /extensions/frontend.json`)](engine/02-frontend-manifest-handler.md)
- [03 — `FrontendAssetsHandler` (`GET /extensions/frontend/*path`)](engine/03-frontend-assets-handler.md)
- [04 — Wire both routes into `Router.build()` + `STOCK_ROUTE_KEYS`](engine/04-router-wiring.md)
- [05 — Extend `/menu.json` to surface hidden non-default routes](engine/05-menu-json-hidden.md)
- [06 — Update `docs/agents/web-server.md`](engine/06-docs-web-server.md)

## CI Checks

- `source`: `cd source && npm run coverage` (CI job: `jasmine`)
- `source`: `cd source && npm run lint` (CI job: `checks`)

## Notes

- The two new handlers read `ExtensionsEnv` **per request** (static getters, no
  caching) — consistent with `ExtensionsEnv`'s design and the backend loader.
  Unlike the backend `ExtensionRoutesLoader`, there is **no boot-time load step**
  and nothing to thread through `ApplicationInstance` / `ServerController` /
  `WebServer` — the handlers are pure request-time and only need `Router.build()`
  wiring.
- Keep the manifest handler's directory read synchronous (`fs.readdirSync` /
  `fs.statSync`) to match `ExtensionRoutesLoader`'s style; these run once per
  page load, not per asset.
- `FrontendAssetsHandler` mirrors `AssetsHandler` almost exactly — the only
  additions are the `ExtensionsEnv.enabled` short-circuit to `NotFoundError` and
  computing `baseDir` from `ExtensionsEnv.frontendDir` at construction/handle
  time rather than from a module-scope constant.

# navi-orders-extension

The SPEC-5 worked example: a self-contained **Orders** extension for the stock
`darthjee/navi-hey` image. It adds

- a backend route — `GET /ext/orders/summary.json` (handler `OrdersSummaryHandler`);
- a frontend page — `OrdersPage`, reachable at `#/ext/orders`;
- a menu entry — **Orders**, via `config/menu.yml`.

See [`docs/guides/navi/extending-navi.md`](../../docs/guides/navi/extending-navi.md)
for the full narrative. This project is kept byte-aligned with that guide's
"Worked example" section.

## Build

```bash
npm ci
npm run build
```

produces:

```
dist/
  backend/orders.js     # copied verbatim from src/backend/
  frontend/orders.js    # bundled ESM, React externalised
  frontend/orders.css   # emitted from the OrdersPage.css import
```

## Test

```bash
npm ci
npm test
```

Runs the example's own Jasmine suite (`tests/backend/`, `tests/frontend/`).

## Run against Navi

```bash
docker compose up -d navi_extensions_app   # from the repo root
```

mounts `dist/` at `/navi/extensions` and `config/menu.yml` over the image menu,
with `NAVI_EXTENSIONS_ENABLED=true`. Navi then serves the route, the page, and
the menu entry.

## Note on npm

This project uses **npm** (`npm ci` / `npm run`), not Yarn, on purpose: it is a
stand-in for a downstream consumer project, which is not bound by Navi's
repo-wide Yarn rule.

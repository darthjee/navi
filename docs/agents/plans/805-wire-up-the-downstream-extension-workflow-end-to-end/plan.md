# Plan: Wire up the downstream extension workflow end to end

Issue: [805-wire-up-the-downstream-extension-workflow-end-to-end.md](../../issues/805-wire-up-the-downstream-extension-workflow-end-to-end.md)

## Overview

IMPL-5 (#794 extension track). The backend (#803) and frontend (#804) extra-route
loaders are merged; the `navi-hey/extension` export and the production Dockerfile
symlink already exist. This plan makes the SPEC-5 workflow real and exercised:
a new `examples/navi-orders-extension/` worked-example project (owned by a
brand-new `guide` agent), a dedicated `navi_extensions_app` compose service that
actually boots the engine with the example mounted, dev-container parity for
`navi-hey/extension`, a committed derived-image Dockerfile, a `smoke-extensions`
CircleCI job that asserts the route + frontend manifest + menu entry, the
`react/jsx-runtime` importmap gap fix that externalised extension bundles need,
reconciliation of the `NAVI_MENU` path to `./config/menu.yml`, and refreshed
`README.md` / `DOCKERHUB_DESCRIPTION.md` env tables.

## Agents involved

- [architect](architect.md) — create the `guide` agent, register `examples/` in
  the roster / folder-structure / CI-checks docs. **Must land first** (see
  Bootstrap ordering below).
- [guide](guide.md) — the `examples/navi-orders-extension/` project: backend
  handler, frontend page, Vite library build, standalone Jasmine harness + specs.
- [frontend](frontend.md) — add `react/jsx-runtime` (+ dev runtime) to the host
  importmap and `manualChunks` so externalised extension bundles resolve at
  runtime.
- [docker](docker.md) — `navi_extensions_app` compose service, dev Dockerfile
  parity, derived-image Dockerfile, `docker_volumes/extensions/` scaffold, the
  `smoke-extensions` script + Makefile target + CircleCI job.
- [docs](docs.md) — `NAVI_MENU` path reconciliation across the guides + SPEC-5,
  version-pin refresh in `extending-navi.md`, README / DOCKERHUB env rows.

## Bootstrap ordering

The `guide` agent **does not exist yet**. `architect.md` step 1 creates
`.claude/agents/guide.md`; nothing may dispatch `Agent(guide)` before that commit
lands. If the implementation tooling fans agents out in parallel, run
`architect/01` first (or have `architect` carry the `guide.md` file work until the
agent exists). Everything else can proceed in parallel once the branch is green,
except the smoke test, which needs `guide` + `docker` + `frontend` all done.

## Shared contracts

### Worked-example identifiers (fixed by SPEC-5 §7 / `extending-navi.md`)

Every consumer below must use these **verbatim** — the guide project produces
them, the smoke script and docs assert them:

| Thing | Value |
|---|---|
| Backend module | `dist/backend/orders.js` (copied verbatim from `src/backend/orders.js`) |
| Endpoint | `GET /ext/orders/summary.json` → `{ "pending": 3, "service": "orders-extension" }` |
| Handler class | `OrdersSummaryHandler`, `import { RequestHandler } from 'navi-hey/extension'` |
| Frontend bundle | `dist/frontend/orders.js` (+ sibling `dist/frontend/orders.css`) |
| Frontend descriptor | `export default [{ path: '/ext/orders', text: 'Orders', component: OrdersPage }]` |
| Page render | `"3 pending order(s)"`; classNames `orders-loading` / `orders-error` / `orders-summary` |
| Menu file | `config/menu.yml` → `entries:\n  - route: /ext/orders\n    text: Orders` |

### `dist/` layout ↔ compose mount (guide → docker)

`guide` guarantees `npm run build` produces exactly:

```
examples/navi-orders-extension/dist/
  backend/orders.js
  frontend/orders.js
  frontend/orders.css
```

`docker` mounts `./examples/navi-orders-extension/dist:/navi/extensions:ro` and
`./examples/navi-orders-extension/config/menu.yml:/home/node/app/config/menu.yml:ro`
into `navi_extensions_app` (port `3040:3000`, `NAVI_EXTENSIONS_ENABLED=true`).

### Externalised specifier list (frontend ↔ guide)

The example's `vite.config.js` `build.lib.rollupOptions.external` and the host
`frontend/index.html` importmap **must list the same React specifiers**:

```
react, react-dom, react-dom/client, react-router-dom, react/jsx-runtime, react/jsx-dev-runtime
```

`frontend` adds `react/jsx-runtime` and `react/jsx-dev-runtime` to both the
importmap and the `react-vendor` `manualChunks` array in `frontend/vite.config.js`
(they currently list only the first four). `guide` externalises the full six.
The smoke test asserts the bundle actually imports without an unresolved-specifier
failure.

### Smoke assertions (docker script ↔ guide runtime)

`scripts/smoke/extensions.sh`, against `http://localhost:3040`:

1. `GET /ext/orders/summary.json` → HTTP 200, JSON body `service == "orders-extension"`, `typeof pending == "number"`.
2. `GET /extensions/frontend.json` → HTTP 200, `.bundles[]` contains an entry whose `src` ends `orders.js`.
3. `GET /menu.json` → HTTP 200, `.entries[]` contains `{ route: "/ext/orders", text: "Orders" }` (server-side, from the mounted `config/menu.yml`).

### Canonical production menu path (docs → docker)

`NAVI_MENU=./config/menu.yml`, resolved against WORKDIR `/home/node/app` ⇒
`/home/node/app/config/menu.yml`. This is what the production image already ships
(`dockerfiles/production_navi_hey/Dockerfile`); the docs are what is wrong. The
derived-image Dockerfile uses `COPY config/menu.yml /home/node/app/config/menu.yml`.

### New env-var rows (docs, matching docker's compose + the prod image)

| Env var | Default | Meaning |
|---|---|---|
| `NAVI_EXTENSIONS_ENABLED` | unset (feature off; truthy = `1`/`true`/`yes`/`on`) | Enable the extra-routes loaders |
| `NAVI_EXTENSIONS_DIR` | `/navi/extensions` | Mount point scanned for `backend/` + `frontend/` |
| `NAVI_MENU` (CLI `-m` / `--menu`) | `./config/menu.yml` | Menu config file path |

### `guide` agent scope / roster (architect)

New agent `guide` owns `examples/` (runnable worked-example projects), tools
`Read, Edit, Write, Bash`. Registered by a row in the `## Specialist agents` table
of `.claude/agents/architect.md`, an `examples/` row in
`docs/agents/folder-structure.md`, and a CI-checks row in
`docs/agents/contributing/commits-and-prs.md` naming the `smoke-extensions` job.

## CI Checks

- `examples/navi-orders-extension`: `npm ci && npm test` (new; not yet a
  dedicated CircleCI unit job — the `smoke-extensions` job runs the build, and
  #806 owns the real downstream test image). Runnable locally now.
- root: `make smoke-extensions` (CI job: `smoke-extensions`, `machine: true`,
  every PR, no `requires:`).
- `frontend`: `docker compose run --rm navi_tests bash -lc 'cd ../frontend && yarn coverage'`
  equivalent — existing `jasmine-frontend` / `checks-frontend` jobs cover the
  importmap + vite.config change.
- `source`: existing `jasmine` job — no engine changes expected, but run it if
  the smoke test surfaces a loader gap.

## Notes

- **Already landed — do not redo:** `source/package.json` `exports` map with
  `./extension`; `dockerfiles/production_navi_hey/Dockerfile`
  `ENV NAVI_EXTENSIONS_DIR` + `/navi/node_modules/navi-hey` symlink;
  `docs/guides/navi/extending-navi.md` and `configuring-the-menu.md`.
- **`agent-roster-and-delegation.md` does not exist** — the issue file names it,
  but the roster actually lives in `.claude/agents/architect.md` +
  `docs/agents/folder-structure.md`. Precedent: commit `cd90a5d` (added the
  `worker` agent + package).
- **npm inside `examples/`** deliberately diverges from Navi's repo-wide
  "Yarn, never npm" rule: the example simulates a *downstream consumer* project,
  which is not bound by Navi's toolchain choice. Call this out in the example's
  README/comments so it is not "fixed" later.
- **`react/jsx-runtime` gap is a real runtime break**, not cosmetic: without the
  frontend change the externalised `orders.js` emits
  `import { jsx } from "react/jsx-runtime"` which the browser cannot resolve, and
  the page silently fails to mount. The smoke test is what catches a regression
  here.
- **`navi_extensions_app` is the first compose service to actually run the Navi
  engine** (every other service overrides `command`). The dev image sets no CMD,
  so the service must supply one — `node bin/navi.js -c config/navi_config.yml -m
  config/menu.yml` from `/home/node/app`. If the stock `navi_config.yml` (from
  `make setup`) triggers warming that destabilises the smoke run, add a minimal
  `examples/navi-orders-extension/config/navi_config.yml` fixture with
  `web.autostart: false` and mount that instead.
- **Compose project name** defaults to the working-dir basename (`scylla`); no
  `COMPOSE_PROJECT_NAME` is set. The Makefile target and CI job must `docker
  compose down` afterwards to avoid leaking the container.
- `frontend/` has a stray `package-lock.json` alongside `yarn.lock` — pre-existing
  noise, out of scope here.
- Example Jasmine specs: the repo-standard glob `**/*[sS]pec.js` will **not**
  match `orders_page_spec.jsx` — the example's `spec/support/jasmine.json` uses
  `**/*[sS]pec.{js,jsx}`.

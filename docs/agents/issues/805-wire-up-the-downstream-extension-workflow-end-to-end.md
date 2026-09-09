# Issue: Wire up the downstream extension workflow end to end

## Description

Part of #794 (**extension track**) — this is **IMPL-5**. Depends on **SPEC-5**
(#799, `docs/agents/future/downstream-extension-workflow.md`), **IMPL-3** (#803,
backend extra-route loader), and **IMPL-4** (#804, frontend extra-route loader),
all merged.

SPEC-5 describes the downstream-developer workflow — folder layout, registration
contracts, derived-image composition, compose/volume wiring, and a worked
example. IMPL-3 and IMPL-4 built the container-side loaders. This issue makes the
end-to-end workflow real and exercised: a downstream developer can add a backend
route + a frontend page + a menu entry to a stock Navi image via a mounted folder
and/or a derived image, following documented steps, with an automated check that
proves it works.

### Already landed (do not redo)

Investigation of the current tree shows several SPEC-5 follow-ups are already
done and are **not** part of this issue:

- `source/package.json` has the `exports` map exposing
  `"./extension": "./lib/common/server/RequestHandler.js"`, so
  `import { RequestHandler } from 'navi-hey/extension'` resolves (verified by
  `source/spec/lib/server/extensions/extension_specifier_spec.js`).
- `dockerfiles/production_navi_hey/Dockerfile` already sets
  `ENV NAVI_EXTENSIONS_DIR=/navi/extensions` and creates the
  `/navi/node_modules/navi-hey` symlink one level above the mount point.
- `docs/guides/navi/extending-navi.md` (the permanent SPEC-5 user guide) and
  `docs/guides/navi/configuring-the-menu.md` already exist.

## Problem

The loaders work, but nothing in the repo proves the documented downstream
workflow end to end, and several wiring pieces are still missing:

- **No worked-example project.** SPEC-5 §7 defines a concrete deliverable
  (`orders` module, route `/ext/orders`, endpoint `GET /ext/orders/summary.json`,
  handler `OrdersSummaryHandler`, page `OrdersPage`, menu label `Orders`). The
  only extension fixtures today are loader unit fixtures under
  `source/spec/support/fixtures/extensions/`, and they import `RequestHandler`
  via a relative path, not the canonical `navi-hey/extension` specifier.
- **Dev container has no extension parity.** `dockerfiles/dev_navi_hey/Dockerfile`
  has neither the `/navi/node_modules/navi-hey` symlink nor
  `NAVI_EXTENSIONS_DIR`, so example imports using `navi-hey/extension` do not
  resolve the way they do in production.
- **No compose / volume wiring.** `docker-compose.yml` mentions extensions only
  in a commented-out block on `navi_app`; no service sets `NAVI_EXTENSIONS_*` or
  mounts an extensions volume, and `docker_volumes/extensions/` does not exist.
- **No committed derived-image example.** The `FROM darthjee/navi-hey:<tag>` +
  `COPY dist/` pattern lives only as prose in `extending-navi.md`.
- **No smoke test.** Nothing boots a composed stack and asserts the example
  route responds and the example page + menu entry render. CI is CircleCI
  (`.circleci/config.yml`); the production image builds only on version tags, and
  there is no compose-boot job.
- **`NAVI_MENU` path inconsistency.** SPEC-5 §6a and `extending-navi.md` assume a
  production menu default of `/navi/menu.yml`; the actual image uses
  `./config/menu.yml`.
- **Stale top-level docs.** `README.md` and `DOCKERHUB_DESCRIPTION.md` env-var
  tables never got the extension / config-menu surface.

## Expected Behavior

- [ ] Following the documented steps, the example backend route responds from a
      composed stack (`GET /ext/orders/summary.json`).
- [ ] The example frontend page renders at `#/ext/orders` with its **Orders**
      menu entry.
- [ ] The `smoke-extensions` job passes in CircleCI on every PR.
- [ ] `docs/guides/navi/extending-navi.md` documents the workflow and matches
      `examples/navi-orders-extension/` exactly (identifiers, `./config/menu.yml`
      path, derived-image snippet).
- [ ] `docker-compose.yml` grows a `navi_extensions_app` service;
      `docker_volumes/extensions/{backend,frontend}/` is scaffolded; the default
      `make dev` / `navi_app` boot is unchanged.
- [ ] Dev and production containers resolve `navi-hey/extension` identically.
- [ ] A `guide` agent exists (`.claude/agents/guide.md`), is listed in the roster
      docs, and owns `examples/`.
- [ ] `README.md` and `DOCKERHUB_DESCRIPTION.md` list `NAVI_EXTENSIONS_ENABLED`,
      `NAVI_EXTENSIONS_DIR`, `NAVI_MENU` and link the extending guide.

## Solution

### 1. Worked-example project — `examples/navi-orders-extension/` (new root folder)

Lift SPEC-5 §7 verbatim into a committed, runnable example project at a **new
top-level `examples/` folder**:

```
examples/navi-orders-extension/
  package.json            # build + test scripts, Vite/React/Jasmine dev deps
  vite.config.js          # library build, React/Router externalised (from the guide)
  .gitignore              # dist/
  config/menu.yml         # { route: /ext/orders, text: Orders }
  src/backend/orders.js   # OrdersSummaryHandler, GET /ext/orders/summary.json
  src/frontend/OrdersPage.jsx
  src/frontend/OrdersPage.css
  src/frontend/entry.js   # default [{ path: '/ext/orders', text: 'Orders', component: OrdersPage }]
  tests/backend/orders_spec.js
  tests/frontend/orders_page_spec.jsx
```

- The backend handler imports `import { RequestHandler } from 'navi-hey/extension'`
  **verbatim** (the canonical specifier from SPEC-5 §1).
- **Example tests are Jasmine** (`orders_spec.js` / `orders_page_spec.jsx`), per
  SPEC-6 (#800), which supersedes SPEC-5 §7.2's `node:test` / `vitest` snippets.
  The full downstream test *harness* / image stays with IMPL-6 (#806).
- **`dist/` is generated, not committed** — `dist/` is git-ignored; the example's
  `npm run build` produces `dist/backend/orders.js` (verbatim copy) +
  `dist/frontend/orders.js` + `orders.css` (Vite lib build). The smoke job and a
  Makefile target run `npm ci && npm run build` before boot.

### 2. New `guide` agent owns `examples/`

`examples/` is a new top-level folder; per the repo's root-folder rule it needs a
named owner. **Introduce a new `guide` specialist agent** that owns `examples/`
(the runnable worked-example projects). Add `.claude/agents/guide.md`, register
it in the agent roster docs (`AGENTS.md` /
`docs/agents/architecture/agent-roster-and-delegation.md`), and set its scope.

### 3. Dev container parity

Add to `dockerfiles/dev_navi_hey/Dockerfile` the equivalent
`/navi/node_modules/navi-hey` symlink (dev bind-mounts the source tree, so the
target is `/home/node/app`) and `ENV NAVI_EXTENSIONS_DIR`, so
`navi-hey/extension` resolves identically to production under `spec/`.

### 4. Compose / volume wiring — dedicated `navi_extensions_app` service

Leave `navi_app` untouched. Add a sibling service in `docker-compose.yml`:

```yaml
navi_extensions_app:
  <<: *base                       # navi:dev image + base source mounts
  ports: [ "3040:3000" ]
  environment:
    NAVI_EXTENSIONS_ENABLED: "true"
  volumes:
    - ./examples/navi-orders-extension/dist:/navi/extensions:ro
    - ./examples/navi-orders-extension/config/menu.yml:/home/node/app/config/menu.yml:ro
    - <repeat *base mounts overridden by the volumes: key>
```

Also scaffold `docker_volumes/extensions/{backend,frontend}/` with `.gitkeep` for
the ad-hoc bind-mount case documented in the guide. The commented block on
`navi_app` is removed (superseded by this service).

### 5. Derived-image pattern

A documented `Dockerfile` under `dockerfiles/` (`FROM darthjee/navi-hey:<tag>`,
`COPY dist/ /navi/extensions/`, `COPY config/menu.yml`, `ENV
NAVI_EXTENSIONS_ENABLED=true`) built from the example, plus the matching compose
snippet, cross-linked from `extending-navi.md`.

### 6. Smoke test — new CircleCI `smoke-extensions` job

New job in `.circleci/config.yml`, on **every PR**:

1. `make build-dev` (the `navi:dev` image, built on branches — the production
   image only builds on version tags, so it is not used here).
2. `cd examples/navi-orders-extension && npm ci && npm run build`.
3. `docker compose up -d navi_extensions_app`.
4. Assert: `GET /ext/orders/summary.json` returns the expected JSON;
   `GET /extensions/frontend.json` lists the bundle;
   `GET /menu.json` (+ the client auto-append rule) yields **Orders**.

Ship the assertion logic as `scripts/smoke/extensions.sh` + a Makefile target so
it is runnable locally and the CI job is a thin wrapper.

### 7. `NAVI_MENU` path reconciliation — fix the docs

No image change. Update SPEC-5 §6a and `docs/guides/navi/extending-navi.md` to the
path the production image actually ships: `NAVI_MENU=./config/menu.yml`
(mounted at `/home/node/app/config/menu.yml`). The example's compose snippet uses
the same.

### 8. Docs

- `docs/guides/navi/extending-navi.md` — reconcile with the committed example
  (identifiers, menu path, derived-image snippet); the worked example must match
  `examples/navi-orders-extension/` exactly.
- `README.md` and `DOCKERHUB_DESCRIPTION.md` — add `NAVI_EXTENSIONS_ENABLED`,
  `NAVI_EXTENSIONS_DIR`, `NAVI_MENU` to the env-var override tables and a short
  "Extending Navi" pointer to the guide.

### Agents

- **guide** — new agent; owns `examples/navi-orders-extension/` (project files,
  example tests, its `vite.config.js` / `package.json`).
- **architect** — creates the `guide` agent, updates the roster docs, owns the
  new-root-folder decision.
- **docker** — `docker-compose.yml` `navi_extensions_app` service,
  `dockerfiles/dev_navi_hey/Dockerfile` parity, derived-image Dockerfile,
  `docker_volumes/extensions/` scaffold, the `smoke-extensions` CircleCI job.
- **dev** — `scripts/smoke/extensions.sh` + Makefile target if it touches dev
  tooling.
- **docs** — `extending-navi.md` reconciliation, `README.md`,
  `DOCKERHUB_DESCRIPTION.md`, SPEC-5 §6a menu-path fix.
- **engine / frontend** — only if the smoke test surfaces a loader/SPA gap.

## Benefits

- Turns the extension mechanism from "loaders exist" into a supported, proven
  workflow a downstream developer can copy from `examples/navi-orders-extension/`.
- The `smoke-extensions` job is a living contract: it fails the moment a future
  change breaks the documented extension path (route, manifest, or menu).
- Reconciles the `NAVI_MENU` path, the dev/prod `navi-hey/extension` parity, and
  the stale top-level docs — removing known inconsistencies between the image,
  SPEC-5, and the guides.
- Establishes `examples/` and its `guide` owner as the home for future runnable
  worked examples.
- Provides the concrete example project that IMPL-6 (#806, test harness) and
  CLEAN-1 (#807, spec cleanup) build on.

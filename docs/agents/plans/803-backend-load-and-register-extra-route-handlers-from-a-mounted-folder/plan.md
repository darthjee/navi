# Plan: Backend: load and register extra route handlers from a mounted folder

Issue: [803-backend-load-and-register-extra-route-handlers-from-a-mounted-folder.md](../../issues/803-backend-load-and-register-extra-route-handlers-from-a-mounted-folder.md)

## Overview

Implement the **Backend** section of SPEC-3 (`docs/agents/future/extension-architecture.md`):
at web-server start, discover ES-module route handlers under an operator-mounted
folder, validate them against the descriptor contract, filter collisions, and
register the survivors into the Express router alongside the stock routes. The
whole mechanism is opt-in via `NAVI_EXTENSIONS_ENABLED` and inert by default. The
async module loading happens in `ApplicationInstance.run()` (already `async`)
*before* the web server is built, so `Router.build()` / `WebServer` construction
stay synchronous and simply receive a pre-resolved descriptor array. The engine
also adds a `navi-hey/extension` subpath export; the docker image adds the
`node_modules` symlink that lets a mounted module resolve that specifier.

## Agents involved

- [engine](engine.md) — `ExtensionsEnv`, `ExtensionRoutesLoader`, descriptor
  validation, `Router` / `WebServer` / `ServerController` / `ApplicationInstance`
  wiring, the `source/package.json` `exports` map, specs, and the
  `docs/agents/web-server.md` update.
- [docker](docker.md) — the production image `navi-hey` symlink and
  `NAVI_EXTENSIONS_DIR` default, plus an opt-in commented example in
  `docker-compose.yml`.

## Shared contracts

### Environment variables (SPEC-3 "Shared contract")

| Variable | Default | Meaning |
|---|---|---|
| `NAVI_EXTENSIONS_ENABLED` | unset → **off** | Enabled only when `String(value).trim().toLowerCase()` is one of `1`, `true`, `yes`, `on`. Everything else (unset, empty, `0`, `false`, `no`, `off`) is disabled. |
| `NAVI_EXTENSIONS_DIR` | `/navi/extensions` | Absolute path to the mounted extension folder inside the container. |

- **Engine** reads both, at container runtime, through a single resolver
  `ExtensionsEnv` (`source/lib/server/extensions/ExtensionsEnv.js`) that reads
  `process.env` directly (precedent: `BaseLogger` + `LOG_LEVEL`). Not threaded
  through `WebConfig` / `ConfigParser` / the `webConfig` constructor argument.
- **Docker** sets `ENV NAVI_EXTENSIONS_DIR=/navi/extensions` in the production
  image and leaves `NAVI_EXTENSIONS_ENABLED` unset (off).

### Mounted-folder layout

```
<NAVI_EXTENSIONS_DIR>/
  backend/     # flat directory of ESM *.js modules (non-recursive; nested dirs ignored, not an error)
```

Load order = directory listing sorted lexicographically by filename.

### Backend module / descriptor contract

Each `backend/*.js` module exports an array of descriptors as the **default
export** or a named export `routes`. Descriptor shape:

| Field | Required | Constraint |
|---|---|---|
| `method` | yes | `GET` / `PATCH` / `POST`, case-insensitive. |
| `path` | yes | non-empty string, starts with `/`, no whitespace. Express path syntax allowed. |
| `handler` | yes | a `RequestHandler` subclass (a class, not an instance); instantiated per request as `new handler(req, res)`. |

Handlers get the same guarantees as stock handlers via `RouteRegister` (GET
`handle()` runs sync; PATCH/POST `handle()` is awaited; `ConflictError`→409,
`ForbiddenError`→403, `NotFoundError`→404, anything else→500; `express.json()`
body parsing already applied).

### `navi-hey/extension` specifier

- **Engine** adds to `source/package.json`:

  ```json
  "exports": {
    ".": "./bin/navi.js",
    "./extension": "./lib/common/server/RequestHandler.js",
    "./package.json": "./package.json"
  }
  ```

  This enables both the external subpath `import { RequestHandler } from 'navi-hey/extension'`
  and Node **self-referencing** of the same string from inside the package tree
  (used by the spec fixtures).
- **Docker** makes the specifier resolvable from a file under the mounted volume
  (which Node's ESM resolver reaches by walking `node_modules` upward, and the
  bind mount shadows anything written inside `NAVI_EXTENSIONS_DIR`): the
  production image adds

  ```dockerfile
  RUN mkdir -p /navi/node_modules \
   && ln -s "$(npm root -g)/navi-hey" /navi/node_modules/navi-hey
  ```

  so resolution from `/navi/extensions/backend/foo.js` walks
  `.../backend/node_modules` → `/navi/extensions/node_modules` →
  `/navi/node_modules/navi-hey` ✓.

### Loader → Router hand-off

`ApplicationInstance.run()` calls
`await ExtensionRoutesLoader.load({ stockRouteKeys })` and passes the resulting
`Array<{ method, path, handler }>` (already validated + collision-filtered, `[]`
when disabled) down as `extensionRoutes` through
`ServerController.build` → `buildWebServer` → `WebServer` / `WebServer.build` →
`new Router({ webConfig, menuConfig, extensionRoutes })`. `Router.build()`
registers them after the stock route loops and before `express.static` /
the catch-all, staying synchronous.

`stockRouteKeys` is a frozen `Set<string>` of `"<METHOD> <path>"` for every stock
route, exported from `Router.js` and independent of `webConfig` / `menuConfig`.

## CI Checks

- `source/`: `cd source && yarn lint` (CI job: `checks`)
- `source/`: `cd source && yarn test` (CI job: `jasmine`)
- production image: `make build` (CI job: `build-and-release`)

## Notes

- **`/engine/reload`**: `PATCH /engine/reload` re-reads the YAML and restarts the
  engine only — it does not rebuild `WebServer` / `Router` and does not re-scan
  the extension folder. Extensions are fixed for the process lifetime; this is a
  documented known limitation, not something to "fix" here.
- **Spec fixtures resolve `navi-hey/extension` via package self-referencing** (the
  `exports` map), because they live under `source/spec/` — inside the package
  tree. No dev-image symlink is needed. A real integration test that loads from an
  actual `/navi/extensions` directory is out of scope for #803.
- **Adding `exports` to `source/package.json` restricts the package's importable
  surface.** The repo imports internally via relative paths and `deku-swarm`, and
  `clients/node` is a separate package, so the risk is low — but `yarn test`,
  `yarn lint`, and `yarn docs` in `source/` must all be re-run after the change,
  and the `.` entry is kept pointing at the current `main` target to avoid a
  behavioural change to the `navi-hey` bin.
- Out of scope per SPEC-3: token-gated (`SecuredRequestHandler`) extensions,
  verbs beyond GET/PATCH/POST, recursive `backend/`, hot-reload, sandboxing, any
  manifest/YAML key for routes.
- IMPL-3 absorbs the two mechanical follow-ups that
  `downstream-extension-workflow.md` parked on IMPL-5 (#805) — the `exports` map
  and the image symlink. #805's body / the SPEC-5 doc note should be trimmed when
  this lands.

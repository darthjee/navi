# Engine Plan: Backend: load and register extra route handlers from a mounted folder

Main plan: [plan.md](plan.md)

## Shared contracts

Copied from [plan.md](plan.md) — this agent **produces** all of it except the
docker symlink:

- **Env vars** — `NAVI_EXTENSIONS_ENABLED` (enabled only when the trimmed,
  lower-cased value is one of `1` / `true` / `yes` / `on`); `NAVI_EXTENSIONS_DIR`
  (absolute, default `/navi/extensions`). Read at runtime through
  `ExtensionsEnv`, straight from `process.env`, never via `WebConfig`.
- **Mounted layout** — `<NAVI_EXTENSIONS_DIR>/backend/*.js`, flat, non-recursive
  (nested dirs ignored, not an error), loaded in lexicographic filename order.
- **Descriptor contract** — module default-exports (or names `routes`) an array
  of `{ method, path, handler }`: `method` ∈ GET/PATCH/POST (case-insensitive);
  `path` a non-empty `/`-prefixed whitespace-free string; `handler` a
  `RequestHandler` subclass instantiated `new handler(req, res)` per request.
- **`navi-hey/extension`** — `source/package.json` gains an `exports` map with
  `"./extension": "./lib/common/server/RequestHandler.js"`; spec fixtures import
  that string and rely on Node self-referencing. The docker image (docker agent)
  adds the `node_modules` symlink for the mounted-folder case.
- **Loader → Router hand-off** — `ExtensionRoutesLoader.load({ stockRouteKeys })`
  returns a validated, collision-filtered `Array<{ method, path, handler }>`
  (`[]` when disabled); `ApplicationInstance.run()` awaits it and threads it as
  `extensionRoutes` through `ServerController` → `WebServer` → `Router`.
  `stockRouteKeys` is a frozen `Set<"<METHOD> <path>">` exported from `Router.js`.

## Steps

- [01 — ExtensionsEnv resolver + fatal-mount exception](engine/01-extensions-env.md)
- [02 — Extension module & descriptor validator](engine/02-module-validator.md)
- [03 — ExtensionRoutesLoader](engine/03-extension-routes-loader.md)
- [04 — Hoist stock route keys + register extension routes in Router](engine/04-router-wiring.md)
- [05 — Thread extensionRoutes through WebServer, ServerController, ApplicationInstance](engine/05-app-wiring.md)
- [06 — Add the navi-hey/extension exports map](engine/06-package-exports.md)
- [07 — Update docs/agents/web-server.md](engine/07-docs.md)

## CI Checks

- `source/`: `cd source && yarn lint` (CI job: `checks`)
- `source/`: `cd source && yarn test` (CI job: `jasmine`)

## Notes

- The application is fully async (`docs/agents/dangers.md`), but this feature's
  only async work — `await import(...)` of extension modules — is done once, at
  boot, inside the already-`async` `ApplicationInstance.run()`, before
  `ServerController.build`. Nothing in the `Engine` loop, `Router.build()`, or
  `WebServer` construction becomes async. Specs use synchronous dummies as usual.
- File-size (300) / complexity (10) / nesting (4) limits are enforced — hence the
  split into `ExtensionsEnv`, `ExtensionModuleValidator`, and
  `ExtensionRoutesLoader` rather than one class.
- Every new custom exception must extend `AppError` (never `Error`) — precedent
  `MenuConfigurationInvalid`.
- New spec files follow `spec/lib/**/*_spec.js` mirroring `lib/`; fixtures live
  under `spec/support/fixtures/`.

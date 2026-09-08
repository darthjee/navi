# Thread extensionRoutes through WebServer, ServerController, ApplicationInstance

Carry the loader's output from `ApplicationInstance.run()` down to `Router`.
Nothing here becomes newly `async` except that `run()` gains one `await` — and it
is already `async`.

## `ApplicationInstance.run()` (`source/lib/services/application/ApplicationInstance.js`)

Before `this.#serverController = ServerController.build({...})`:

```js
const extensionRoutes = await ExtensionRoutesLoader.load({
  stockRouteKeys: STOCK_ROUTE_KEYS,
});
this.#serverController = ServerController.build({
  webConfig: this.config.webConfig,
  menuConfig: this.#configStore.menuConfig,
  extensionRoutes,
});
```

Import `ExtensionRoutesLoader` and `STOCK_ROUTE_KEYS` (from `../../server/Router.js`).
`ExtensionsDirectoryMissing` thrown here propagates out of `run()` and aborts
boot, matching `MenuConfigurationInvalid` — no `try/catch`.

Note: `load()` runs **regardless of `web.port`**. When there is no web config,
`ServerController.build` produces a `null` web server and `extensionRoutes` is
simply unused — acceptable (a one-time no-op scan). If a reviewer prefers, gate
the call on `this.config.webConfig` being present; either is fine, state the
choice in the commit.

## `ServerController` (`source/lib/services/engine/ServerController.js`)

- `static build({ webConfig, menuConfig = [], extensionRoutes = [] })` — forward
  `extensionRoutes` to `buildWebServer`.
- `buildWebServer({ webConfig, menuConfig = [], extensionRoutes = [] })` →
  `WebServer.build({ webConfig, menuConfig, extensionRoutes })`.
- `buildSampler` unchanged. JSDoc updated for both.

## `WebServer` (`source/lib/server/WebServer.js`)

- `constructor({ webConfig, menuConfig = [], extensionRoutes = [] })` →
  `new Router({ webConfig, menuConfig, extensionRoutes }).build()`.
- `static build({ webConfig, menuConfig = [], extensionRoutes = [] })` — returns
  `null` when `!webConfig`, else `new WebServer({ webConfig, menuConfig, extensionRoutes })`.
- JSDoc updated.

## Specs

- `WebServer_spec.js` — a `WebServer.build({ webConfig, extensionRoutes: [descriptor] })`
  starts a real server and the extension route responds (mirror the existing
  `menu config threading` test that does a live `http.get`).
- `ServerController_spec.js` — `build`/`buildWebServer` pass `extensionRoutes`
  through to `WebServer.build` (spy).
- `ApplicationInstance` spec (whichever file exercises `run()`), or a new focused
  spec — with `NAVI_EXTENSIONS_ENABLED` unset, `run()` still boots and
  `ExtensionRoutesLoader.load` resolves `[]`; with a fixture dir set, the
  descriptors reach the built `Router`. Keep it light — the loader itself is
  covered in step 03; here only the wiring/`await` matters. Restore
  `process.env` in `afterEach`.

## Files to Change

- `source/lib/services/application/ApplicationInstance.js` — `await` the loader in
  `run()`, pass `extensionRoutes` to `ServerController.build`; new imports.
- `source/lib/services/engine/ServerController.js` — thread `extensionRoutes`
  through `build` / `buildWebServer`; JSDoc.
- `source/lib/server/WebServer.js` — thread `extensionRoutes` through
  `constructor` / `build`; JSDoc.
- `source/spec/lib/server/WebServer_spec.js` — live extension-route test.
- `source/spec/lib/services/engine/ServerController_spec.js` — pass-through test.
- `source/spec/lib/services/application/ApplicationInstance_spec.js` (or the
  existing `run()` spec) — boot-with/without-extensions wiring test.

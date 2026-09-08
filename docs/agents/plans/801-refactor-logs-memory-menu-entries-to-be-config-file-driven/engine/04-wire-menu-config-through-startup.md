# Thread the menu config through startup

Carry the parsed `--menu` path from the CLI entrypoint down to the `Router`,
loading the file once at startup next to the main config. The menu config travels
as a plain `MenuEntry[]` value alongside `webConfig`; it is **not** folded into
the `Config` model.

## Threading path

1. **`source/bin/navi.js`** — destructure `{ config, menu }` from
   `ArgumentsParser.parse(...)`; call `Application.loadConfig(config, menu)`.
2. **`source/lib/services/application/Application.js`** —
   `loadConfig(configPath, menuPath)` forwards both to the instance.
3. **`source/lib/services/application/ApplicationInstance.js`** —
   `loadConfig(configPath, menuPath)` passes `menuPath` to
   `this.#configurator.load(configPath, menuPath)`.
4. **`source/lib/services/application/ApplicationConfigurator.js`** —
   `load(configPath, menuPath)` calls `MenuConfig.fromFile(menuPath)` and passes
   the result into the `ConfigStore` as a new `menuConfig` field. Loader
   exceptions (`MenuConfigurationInvalid`) propagate out of `load`, aborting
   startup — same posture as `Config.fromFile` errors.
5. **`source/lib/services/application/ConfigStore.js`** — add a `menuConfig`
   constructor field + getter (plain value holder, like `entryFilePath`).
6. **`source/lib/services/application/ApplicationInstance.js#run()`** — pass
   `menuConfig: this.#configStore.menuConfig` into
   `ServerController.build({ webConfig, menuConfig })`.
7. **`source/lib/services/engine/ServerController.js`** — `build()` and
   `buildWebServer()` accept and forward `menuConfig` to
   `WebServer.build({ webConfig, menuConfig })`.
8. **`source/lib/server/WebServer.js`** — constructor and `build()` accept
   `menuConfig` and pass it to `new Router({ webConfig, menuConfig })`.

Default `menuConfig` to `[]` at each boundary so partially-updated call sites and
DI-based specs keep working.

## Files to Change

- `source/bin/navi.js` — destructure `menu`; pass to `Application.loadConfig`.
- `source/lib/services/application/Application.js` — `loadConfig` second param.
- `source/lib/services/application/ApplicationInstance.js` — `loadConfig` second
  param; `run()` passes `menuConfig` to `ServerController.build`.
- `source/lib/services/application/ApplicationConfigurator.js` — `load` second
  param; build `MenuConfig.fromFile`; put on `ConfigStore`.
- `source/lib/services/application/ConfigStore.js` — `menuConfig` field + getter.
- `source/lib/services/engine/ServerController.js` — accept/forward `menuConfig`
  in `build` + `buildWebServer`.
- `source/lib/server/WebServer.js` — accept/forward `menuConfig` to `Router`.
- Specs for each of the above (`ApplicationInstance_spec`,
  `ApplicationConfigurator_spec`, `ConfigStore_spec`, `ServerController_spec`,
  `WebServer_spec`, and any `Application_spec` / `bin` smoke spec) — thread the
  new argument, add an assertion that a configured menu path reaches the
  `Router` / that `/menu.json` responds with the file's entries end-to-end, and
  that an invalid menu file aborts `loadConfig`.

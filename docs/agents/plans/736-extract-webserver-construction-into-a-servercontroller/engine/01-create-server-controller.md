# Create ServerController

Add a new `ServerController` class that wraps `WebServer` the way `EngineController` (`source/lib/services/engine/EngineController.js`) wraps `Engine`. It is the new home for the construction logic currently in `ApplicationInstance#buildWebServer`.

Shape:
- `constructor({ webServer } = {})` — accepts an optional injected `WebServer` for testing (same DI pattern as `EngineController`'s constructor).
- `#webServer` — private field holding the wrapped `WebServer` instance, or `null` when there's no web config. Kept private (not exposed as a raw public field) — external callers only ever go through `start()`/`shutdown()`.
- `buildWebServer({ webConfig })` — instance method, returns `WebServer.build({ webConfig })`. Kept as a regular (non-private) method so specs can `spyOn(ServerController.prototype, 'buildWebServer')`, the same pattern already used for `EngineController.prototype.buildEngine`.
- `static build({ webConfig })` — **always returns a `ServerController` instance, never `null`**. Constructs the controller, sets `controller.#webServer = controller.buildWebServer({ webConfig })` (which may itself be `null`), and returns it.
- `start()` — returns `this.#webServer?.start()`. Resolves to `undefined` (no rejection, no throw) when there's no wrapped server, safe to pass straight into `PromiseAggregator#add`.
- `shutdown()` — returns `this.#webServer?.shutdown()`, same null-safety as `start()`.

Add `source/spec/lib/services/engine/ServerController_spec.js` covering:
- `.build({ webConfig: undefined })` returns an instance (not `null`).
- `.build({ webConfig })` calls `buildWebServer` and wraps its result.
- `#start()` delegates to the wrapped `WebServer#start()` when present (spy on `WebServer.prototype.start`, same pattern as `Application_webServer_spec.js`), and resolves to `undefined` without throwing when there's no wrapped server.
- `#shutdown()` delegates similarly, and is safe to call when there's no wrapped server.

## Files to Change
- `source/lib/services/engine/ServerController.js` — new file, the class described above.
- `source/spec/lib/services/engine/ServerController_spec.js` — new spec file covering it.

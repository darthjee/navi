# Update EngineController to delegate through ServerController

`EngineController` currently holds a raw public `webServer` field, wired in from outside by `ApplicationInstance` after both are built, and reaches into it directly on idle-timeout shutdown:

```javascript
webServer?.shutdown();
```

Replace that raw field with a `ServerController` reference, so `WebServer` stays fully encapsulated behind `ServerController` (created in step 01):

- Rename the public field `webServer` to `serverController` (declared alongside the existing public `engine` field near the top of the class).
- In `shutdown()`, change `this.webServer?.shutdown();` to `this.serverController?.shutdown();`. Keep the optional chaining — in unit tests `serverController` may still be unset/`null` when nothing wires it in, independent of `ServerController`'s own never-null `build()` contract (that contract only applies to the real construction path in `ApplicationInstance`).
- Update the field's JSDoc comment accordingly (currently documents `webServer` as "the web server, if any wired in externally" or similar — reword to `serverController`).

Do not change `buildEngine()`'s `keepAlive`/`idleTimeoutMs` derivation — it must keep reading `this.config.webConfig` directly, since `EngineController.build()` runs before `ServerController` is constructed in `ApplicationInstance#run` (see step 03) and has no `serverController` to read from yet.

## Files to Change
- `source/lib/services/engine/EngineController.js` — rename the `webServer` field to `serverController`; update `shutdown()`'s delegation call and the field's JSDoc.
- `source/spec/lib/services/engine/EngineController_spec.js` — in the `#shutdown` describe block, rename `controller.webServer = { shutdown: jasmine.createSpy('shutdown') }` / `controller.webServer = null` to `controller.serverController = ...` / `controller.serverController = null`, and update the corresponding assertions (`expect(controller.webServer.shutdown)` → `expect(controller.serverController.shutdown)`). Consider renaming the two nested `describe` blocks ("when a web server is present" / "when there is no web server") to "when a server controller is present" / "when there is no server controller" for clarity.

# Update ApplicationInstance wiring

`ApplicationInstance` currently owns `buildWebServer()` and a raw public `this.webServer` field (built and started directly in `run()`). Replace both with a private `ServerController` reference, wired the same way `#engineController` already is.

In `source/lib/services/application/ApplicationInstance.js`:
- Add a `#serverController` private field alongside the existing `#engineController`.
- Remove the `buildWebServer()` method entirely (moved into `ServerController` in step 01).
- Remove the `WebServer` import (`import { WebServer } from '../../server/WebServer.js';`) — nothing in this file references it directly once `buildWebServer()` is gone.
- Add `import { ServerController } from '../engine/ServerController.js';`.
- In `run()`, replace:
  ```javascript
  this.webServer = this.buildWebServer();
  this.#engineController.webServer = this.webServer;
  ```
  with:
  ```javascript
  this.#serverController = ServerController.build({ webConfig: this.config.webConfig });
  this.#engineController.serverController = this.#serverController;
  ```
- Replace `this.#aggregator.add(this.webServer?.start());` with `this.#aggregator.add(this.#serverController.start());` — no `?.` needed here since `ServerController.build()` never returns `null` (step 01's contract), and `ServerController#start()` is itself null-safe internally.
- No change needed to `shutdown()` — it already just delegates to `this.#engineController.shutdown()`, which (after step 02) shuts the server controller down internally.

## Files to Change
- `source/lib/services/application/ApplicationInstance.js` — add `#serverController` field, drop `buildWebServer()` and the `WebServer` import, add the `ServerController` import, update `run()`'s construction/wiring/aggregation as described above.

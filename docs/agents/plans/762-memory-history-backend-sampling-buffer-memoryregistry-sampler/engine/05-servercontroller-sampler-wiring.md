# ServerController sampler wiring

`ServerController` (`source/lib/services/engine/ServerController.js`) owns the sampler's
lifecycle, mirroring how it wraps `WebServer`.

## What to do

- Add a `buildSampler({ webConfig })` method parallel to the existing overridable
  `buildWebServer({ webConfig })`:
  - return `null` when `!webConfig` (so "no `web:` section → no sampler" holds — note
    `ServerController` itself is **always** constructed, only `#webServer` goes `null`);
  - otherwise `return new MemorySampler(webConfig.memory)`.
- In `ServerController.build({ webConfig })` (signature unchanged), assign
  `controller.#sampler = controller.buildSampler({ webConfig })` alongside the existing
  `#webServer` assignment.
- `start()`: call `this.#sampler?.start()` in addition to `this.#webServer?.start()`.
  Return value / promise behaviour of `start()` is unchanged (sampler `start()` is sync).
- `shutdown()`: call `this.#sampler?.stop()` **before** `this.#webServer?.shutdown()`, so
  sampling stops even if the web-server shutdown rejects. Return the web-server shutdown
  result as today.
- Specs:
  - `ServerController_spec.js` — the current spec passes a raw `{ port: 1234 }` (no
    `.memory`). `spyOn(ServerController.prototype, 'buildSampler')` and return a fake
    sampler with `start` / `stop` spies. Assert: `start()` → `sampler.start()`;
    `shutdown()` → `sampler.stop()` called before `webServer.shutdown()`; no sampler
    constructed (`buildSampler` returns `null`) when `webConfig` is undefined.
  - `Application_webServer_spec.js` — one light end-to-end check: with a `web:` config,
    after `Application.run()` sampling happens (spy on `MemoryRegistry.add` or the
    reader); `Application.shutdown()` stops it, no leaked interval.

## Files to Change

- `source/lib/services/engine/ServerController.js` — `buildSampler` seam, `#sampler`
  field, `start()` / `shutdown()` calls + `MemorySampler` import.
- `source/spec/lib/services/engine/ServerController_spec.js` — `buildSampler` spy +
  start/stop/ordering/guard assertions.
- `source/spec/lib/services/application/Application_webServer_spec.js` — end-to-end
  sampling + shutdown check.

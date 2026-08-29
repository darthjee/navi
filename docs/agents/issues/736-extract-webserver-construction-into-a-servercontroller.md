# Issue: Extract WebServer construction into a ServerController

## Description

Extract `WebServer` construction and lifecycle management out of `ApplicationInstance` (`source/lib/services/application/ApplicationInstance.js`) into a new `ServerController` (`source/lib/services/engine/ServerController.js` or a similarly-named sibling), mirroring the responsibility split `EngineController` already has for the engine (introduced in #735).

## Problem

This follows on from #735, which moved engine construction/wiring (`buildEngine`, event binding, start/pause/stop delegation) out of `ApplicationInstance` and into `EngineController`. `ApplicationInstance` currently still owns `buildWebServer()` and directly manages `this.webServer` (build, start, shutdown) — the same pattern #735 removed for the engine — leaving `WebServer` as a raw public field/method surface rather than encapsulated behind a controller.

This also blocks the follow-up aggregator work in #737: `PromiseAggregator`'s planned `startAll(controllers)` needs a uniform `start()` (and `shutdown()`) contract across every controller it drives. `EngineController` already satisfies that (`Engine` always exists), but `WebServer` doesn't — `WebServer.build()` returns `null` when there's no web config, so without a `ServerController` wrapper, callers (including the future aggregator) must special-case the missing-server case themselves.

Separately, `EngineController`'s idle-timeout shutdown path (`onIdleTimeout: () => this.shutdown()`) reaches directly into a raw `webServer` field wired in from outside (`this.#engineController.webServer = this.webServer`) to call `this.webServer?.shutdown()` — coupling `EngineController` to `WebServer`'s shape instead of to a controller abstraction.

## Expected Behavior

- `ApplicationInstance` no longer holds a direct `this.webServer` reference or a `buildWebServer()` method — it holds/delegates through a `ServerController`, the same way it now does for `EngineController`.
- `Application.buildWebServer()` (static facade) and `ApplicationInstance#buildWebServer()` are removed entirely, mirroring how #735 deleted `Application.buildEngine()`. `buildWebServer` becomes purely internal to `ServerController`.
- `ServerController.build({ webConfig })` always returns a `ServerController` instance (never `null`), wrapping a possibly-`null` `WebServer` internally. Its `start()`/`shutdown()` methods delegate to the wrapped `WebServer` with optional chaining and resolve safely (`undefined`) when there's no server configured.
- `EngineController` holds a `serverController` reference instead of a raw `webServer` field, and its idle-timeout shutdown path calls `this.serverController?.shutdown()` instead of reaching into the raw `WebServer`.
- Existing behavior (web server start/shutdown timing, idle-timeout-triggered shutdown, `null`-webConfig handling) is unchanged from a caller's perspective — this is a pure encapsulation refactor, not a behavior change.
- Specs that currently touch `ApplicationInstance#webServer`/`buildWebServer()` directly (`Application_spec.js:118-129`, `ApplicationInstance_spec.js:93,127`) are migrated to spy on `ServerController.prototype.buildWebServer` instead, following the same pattern #735 used for `engine`/`buildEngine()`. `EngineController_spec.js`'s direct `controller.webServer = {...}` pokes are updated to set/spy a `ServerController`-shaped object under the renamed `serverController` field.

## Solution

**ServerController shape:**
- New `ServerController` wraps `WebServer` the way `EngineController` wraps `Engine`.
- `ServerController.build({ webConfig })` always returns an instance, never `null` — mirroring `EngineController.build`'s never-null contract rather than `WebServer.build`'s nullable one, so a future `PromiseAggregator.startAll()` (#737) can drive every controller uniformly without null-checking.
- `ServerController` exposes its own `start()` and `shutdown()` methods, delegating internally to the wrapped `WebServer` with optional chaining (`this.webServer?.start()` / `this.webServer?.shutdown()`). It does not just expose a raw `webServer` for callers to poke at directly.
- `ApplicationInstance.buildWebServer()` moves into `ServerController` as an internal method used by its `build` static factory (consistent with `EngineController.build` from #735).

**Wiring changes:**
- `ApplicationInstance` stops holding a direct `this.webServer` reference; it holds a `ServerController` instance and calls `start()`/`shutdown()` through it.
- `EngineController` stops reaching into a raw `webServer` field for its idle-timeout shutdown path. Instead it holds a `serverController` reference and calls `this.serverController?.shutdown()`, keeping `WebServer` fully encapsulated behind `ServerController`. `ApplicationInstance` wires this the same way it wires today's `this.#engineController.webServer = this.webServer` — just with the controller instead of the raw server.
- `EngineController.build()` continues to derive `keepAlive`/`idleTimeoutMs` from `this.config.webConfig` directly (not from the `ServerController` instance), since it's constructed before `ServerController` exists — this ordering is preserved as-is.

**Removed surface:**
- `Application.buildWebServer()` and `ApplicationInstance#buildWebServer()` are deleted entirely, mirroring #735's removal of `Application.buildEngine()`.

**Test migration:**
- Specs that call/spy `buildWebServer()` directly on `Application`/`ApplicationInstance` (`Application_spec.js:118-129`, `ApplicationInstance_spec.js:93,127`) spy on `ServerController.prototype.buildWebServer` instead.
- `EngineController_spec.js`'s direct `controller.webServer = { shutdown: jasmine.createSpy(...) }` pokes are updated to the renamed `serverController` field with a `ServerController`-shaped fake.

**Edge cases handled by this shape (no extra logic needed):**
- Web server start failure: `ServerController.start()` returns the same promise `WebServer.start()` produces, so rejection propagation through `PromiseAggregator` is unaffected.
- Idle-timeout shutdown racing an unstarted/never-configured server: both `WebServer.shutdown()` and the new `ServerController.shutdown()` layer are `?.`-guarded, so this stays safe.
- Double shutdown: idempotency is unchanged from today's `WebServer.shutdown()` behavior — not a new concern introduced by this refactor.

**Explicitly out of scope:**
- #737's aggregator `startAll()` work itself — only the `start()`/`shutdown()` contract shape needs to line up here, not the aggregator changes.
- Any change to `WebServer.js`/`Router.js` internals.
- Renaming/restructuring `EngineController`'s other methods (`pause`/`stop`/`continue`/etc.).

**Open question carried forward:** whether #737's `startAll()` also wants a uniform `shutdown()`/`stop()` contract across controllers beyond the `start()` shape decided here — that would extend past this issue's scope and can be resolved when #737 is discussed.

## Benefits

- Brings `WebServer` ownership to encapsulation parity with `Engine`/`EngineController`, removing the last raw-field/method pattern #735 left behind.
- Unblocks #737: gives the future `PromiseAggregator.startAll()` a uniform, never-null controller contract to drive across both engine and server lifecycles.
- Removes `EngineController`'s direct coupling to `WebServer`'s shape, replacing it with a `ServerController` abstraction it can call through instead.
- Shrinks `ApplicationInstance`'s public surface (`webServer` field and `buildWebServer()` method both go away), consistent with the ongoing responsibility-extraction series (#717, #724, #731, #735).

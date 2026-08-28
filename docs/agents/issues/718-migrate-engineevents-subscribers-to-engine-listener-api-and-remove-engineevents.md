# Issue: Migrate EngineEvents subscribers to Engine listener API and remove EngineEvents

## Problem

`EngineEvents` (`source/lib/services/engine/EngineEvents.js`) is a small singleton event bus for engine lifecycle transitions (`'stop'`, `'start'`). It currently has real subscribers/emitters tied to it in ways that make it hard to reason about and hard to remove:

- `EngineController` (`source/lib/services/engine/EngineController.js`) emits `'stop'` (in `stop()` and `finishRun()`) and `'start'` (in `start()`).
- `source/lib/common/utils/logging/LogBufferCollection.js:19` subscribes to `'stop'` to clear job/worker log buffers (`EngineEvents.on('stop', () => this.clear())`). This backs both buffers inside `LogRegistryInstance`.
- `FailureChecker` (`source/lib/services/execution/FailureChecker.js`), per `worker.md`'s existing "should become an injectable listener" note, is also tied to this lifecycle indirectly (via `RunReporter`) and was already flagged as needing to move to an injected listener.

`EngineStopService` (`source/lib/services/engine/EngineStopService.js`) is flagged in the same `worker.md` table row, but it never actually subscribed to `EngineEvents` — it's purely a static-`Application`-facade caller. Its DI cleanup is independent of this migration and tracked separately as #728.

This was originally scoped as part of #717 (Refactor `ApplicationInstance`), but during enhancement dialogue on #717 it became clear `EngineEvents` is **not** dead code (an earlier draft of #717 incorrectly claimed it had no subscribers) and removing it requires migrating every consumer first — that's a distinct, self-contained piece of work from the `ApplicationInstance` SRP split, so it's tracked here instead.

#717 has since landed (`e94229c` / PR #719) — `EngineController`'s `emit('stop')`/`emit('start')` calls (in `stop()`, `start()`, `finishRun()`) are the actual call sites this migration touches. This issue is unblocked.

## Expected Behavior

- `Engine` (`worker/lib/services/Engine.js`, in `deku-swarm`) exposes a generic, domain-agnostic listener API (`on(eventName, handler)` / `emit(eventName, ...args)`), scoped to that specific `Engine` instance.
- `EngineController` fires `'stop'` and `'start'` on `this.engine` at the same call sites it does today, plus a new distinct `'finish'` event at true run completion (see Solution below) — no more calls into the static `EngineEvents` singleton.
- `LogBufferCollection`'s job/worker log buffers still clear automatically on every stop (mid-run or final), now via `engine.on('stop', ...)` wired explicitly once the engine is built, instead of self-subscribing to a global bus in its own constructor.
- `RunReporter` (and, through it, `RunSummary` + `FailureChecker`) still runs exactly once per completed run, via `engine.on('finish', ...)` — and, critically, does **not** run on a mid-run API-triggered stop/pause.
- `source/lib/services/engine/EngineEvents.js` and its spec no longer exist; nothing in the codebase imports `EngineEvents` anymore, including `source/spec/support/utils/RegistryCleanupUtils.js`.
- `worker.md`'s "Engine auxiliary services" table reflects the new reality: `EngineEvents`, `FailureChecker`, and `RunSummary`'s "should become an injectable listener" notes are marked done, and the stale pre-#717 file paths in that table are corrected.

## Solution

- Add a generic listener/observer API to `Engine` in `deku-swarm` (`worker/lib/services/Engine.js`), keeping it domain-agnostic (not Navi-specific event names).
- Migrate both known `EngineEvents` consumers to the new API:
  - `LogBufferCollection` (clear buffers on `'stop'`).
  - `RunReporter` (wraps `RunSummary` + `FailureChecker`, subscribed on a new distinct `'finish'` event — see "FailureChecker/RunReporter and the 'finish' event" below).
- Once both consumers are migrated, delete `source/lib/services/engine/EngineEvents.js` and `source/spec/lib/services/engine/EngineEvents_spec.js`, and remove the now-dead `EngineEvents.reset()` call (and its import) from `source/spec/support/utils/RegistryCleanupUtils.js:24`.
- Update `worker.md`'s "Engine auxiliary services" table: mark the "should become an injectable listener" note as done for `EngineEvents`, `FailureChecker`, **and** `RunSummary` (resolved indirectly — `RunReporter`, which wraps both `RunSummary` and `FailureChecker`, is the actual `'finish'` listener), and correct their stale file paths (`source/lib/services/EngineEvents.js`, `source/lib/services/FailureChecker.js` — neither reflects the current `engine/`/`execution/` subfolder layout from #717). `EngineStopService`'s row is out of scope here — see #728.

### Listener API design

`Engine`'s own lifecycle methods (`start()`/`stop()`/`pause()`/`resume()`) do **not** line up with when Navi's `'stop'`/`'start'` events actually fire today — `EngineController.stop()` calls `engine.pause()` (not `engine.stop()`) after clearing queues, and `EngineController.start()` calls `engine.resume()` (not `engine.start()`). The real `engine.stop()` (halting the loop for good) only happens in `shutdown()`, and nothing is emitted for that today. So `Engine` firing events tied to its own method calls would change consumer-visible semantics and was rejected.

Instead, `Engine` becomes a **generic instance-scoped emitter** with no opinion on event names — composing something like Node's `EventEmitter` internally and exposing `on(eventName, handler)`/`emit(eventName, ...args)`. `EngineController` keeps deciding when to fire (same call sites as today), just targeting the specific `engine` instance instead of the global `EngineEvents` singleton:

```js
// worker/lib/services/Engine.js
class Engine {
  #emitter = new EventEmitter();
  on(name, handler) { this.#emitter.on(name, handler); }
  emit(name, ...args) { this.#emitter.emit(name, ...args); }
}

// EngineController.js
async stop() {
  // ...
  this.engine.emit('stop'); // was: EngineEvents.emit('stop')
}
```

### Wiring implication for `LogBufferCollection`

`LogBufferCollection` currently self-subscribes in its own constructor (`EngineEvents.on('stop', () => this.clear())`), but it's built inside `LogRegistry.build()` — called from `ApplicationConfigurator.load()` during `ApplicationInstance.loadConfig()` — **before** `Engine` exists (`Engine` is only built later, in `ApplicationInstance.run()` → `buildEngine()`). An instance-scoped `engine.on(...)` can't be called from the constructor anymore.

Resolution: drop the auto-subscribe-in-constructor pattern. Once `ApplicationInstance` builds the engine, wire the subscription explicitly at that point (the same place `engine`/`webServer` are already wired into `EngineController`), e.g. `this.engine.on('stop', () => this.#logRegistry.clear())` (or equivalent for the two buffers backing `LogRegistryInstance`).

### FailureChecker/RunReporter and the `'finish'` event

`FailureChecker` isn't an `EngineEvents` subscriber today — `RunReporter.report()` calls `FailureChecker.check()` synchronously, and `RunReporter.report()` itself is only called from `EngineController.finishRun()`, which is a **different** call site from `EngineController.stop()` even though both currently emit the same `'stop'` event:

- `stop()` fires on every mid-run stop/pause (e.g. via the HTTP API) — this is what `LogBufferCollection` correctly reacts to.
- `finishRun()` fires only at true run completion, and is the only place that triggers `RunReporter.report()` (which can call `process.exit(1)` via `FailureChecker`).

Naively subscribing `RunReporter`/`FailureChecker` to the same `'stop'` event `LogBufferCollection` uses would wrongly run the failure-threshold check — and potentially exit the process — on every mid-run API-triggered stop, not just at actual completion.

Resolution: `EngineController.finishRun()` emits a **new, distinct `'finish'` event** instead of reusing `'stop'`. `RunReporter` is what subscribes to `'finish'` (not `RunSummary`/`FailureChecker` individually — `RunReporter` already wraps both in its existing `report()` call), wired once alongside the `LogBufferCollection` subscription when `ApplicationInstance` builds the engine, e.g. `this.engine.on('finish', () => this.#reporter.report({ failureConfig: this.config.failureConfig }))`. `LogBufferCollection` keeps subscribing to `'stop'` only.

### Edge cases

- **Test teardown**: `source/spec/support/utils/RegistryCleanupUtils.js:24` calls `EngineEvents.reset()` between specs to strip stale global listeners. Since the new API is instance-scoped (each spec builds its own `Engine`, discarded after the example), this call must be deleted along with the `EngineEvents` import — there's no longer a global bus to reset; per-instance listeners are naturally garbage-collected with the `Engine` instance that held them.
- **Multiple listeners per event**: both `LogRegistryInstance` buffers (`#jobLogs`, `#workerLogs`) each independently call `EngineEvents.on('stop', ...)` today; composing Node's `EventEmitter` inside `Engine` preserves this (multiple `on()` calls for the same name already fire in registration order), so no behavior change needed there.
- **Unhandled custom events don't throw**: `'stop'`/`'finish'` aren't Node's reserved `'error'` event, so `engine.emit(...)` with zero listeners attached (e.g. in specs that build a bare `Engine` without wiring `ApplicationInstance`) is a safe no-op, matching today's behavior with an empty `EngineEvents` bus.
- **Listener-throw ordering**: if one `'stop'`/`'finish'` listener throws, `EventEmitter.emit()` calls listeners synchronously in registration order and a throw stops later listeners from running in that same tick — this matches today's single-global-bus behavior exactly, so it's not a new risk introduced by the migration, just worth a regression spec confirming parity.

### Out of scope

- Any further SRP splitting of `ApplicationInstance` itself — that's #717.
- `EngineStopService`'s static-`Application`-import → injected-status-provider cleanup — split off as #728, since it never subscribed to `EngineEvents` and is independent of this migration.

## Benefits

- Removes a global, static event bus (`EngineEvents`) in favor of an instance-scoped listener API, eliminating hidden cross-module coupling and the risk of stale listeners leaking across `Engine` instances (notably in tests).
- Keeps `Engine` (in `deku-swarm`) domain-agnostic and reusable — it gains a generic pub/sub surface with no Navi-specific event vocabulary baked in.
- Resolves the last of `worker.md`'s "should become an injectable listener" notes for `EngineEvents`, `FailureChecker`, and `RunSummary`, closing out tech debt flagged since the `deku-swarm` extraction.
- Fixes a latent correctness gap surfaced during design: separating `'stop'` from a new `'finish'` event prevents the failure-threshold check (and its `process.exit`) from ever firing on a routine mid-run API stop.

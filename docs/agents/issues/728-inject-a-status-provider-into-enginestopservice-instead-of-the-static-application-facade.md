# Issue: Inject a status provider into EngineStopService instead of the static Application facade

## Description

`EngineStopService` (`source/lib/services/engine/EngineStopService.js`) is shared logic for `PATCH /engine/stop` and `POST /api/engine/stop`. It currently imports the static `Application` facade (`source/lib/services/application/Application.js`) directly:

```js
class EngineStopService {
  static stop() {
    if (!Application.isRunning()) throw new ConflictError();
    Application.stop();
    return { status: 'stopping' };
  }
}
```

`docs/agents/worker.md`'s "Engine auxiliary services" table already flags this: "Navi-specific HTTP glue; not generic today. Should become an injectable listener."

This was originally going to be bundled into [#718](https://github.com/darthjee/navi/issues/718) (Migrate `EngineEvents` subscribers to `Engine` listener API), but during enhancement dialogue on #718 it became clear `EngineStopService` never subscribed to `EngineEvents` in the first place — before or after that migration, it's purely a static-facade caller, not a listener. Its cleanup is independent of the `EngineEvents` → `Engine` listener API work, so it's tracked here instead. This issue does not touch `EngineEvents` or the `Engine` listener API — that remains #718's scope.

## Problem

`EngineStopService` reaches into the static `Application` facade directly (`Application.isRunning()`, `Application.stop()`), rather than depending on an injected abstraction. This makes it harder to test in isolation (tests must `spyOn(Application, ...)` and `Application.reset()` around every spec) and is inconsistent with the rest of the "Engine auxiliary services" — `EngineController`, `LogBufferCollection`/`LogRegistry`, `ApplicationInstance`, and `RunReporter` (via `FailureChecker`/`RunSummary`) already reach the engine through `Engine`'s listener API or constructor injection rather than a static facade.

`docs/agents/worker.md`'s table row for `EngineStopService` is also stale: it lists the old path `source/lib/services/EngineStopService.js`, but the file now lives at `source/lib/services/engine/EngineStopService.js` (moved in #720). The row's "Extraction note" still says the injectable-provider work is outstanding.

## Solution

- Replace `EngineStopService`'s direct static import of `Application` with an injected status provider, passed as a default parameter on the static method: `static stop(statusProvider = Application)`. `EngineStopService` stays a stateless static utility — callers keep working unchanged (`EngineStopService.stop()`), while tests can pass a test double instead of `spyOn`-ing `Application`. No changes needed to `Router.js`/`HandlerConfig` wiring.
- The two callers don't need code changes (they keep calling `EngineStopService.stop()` with no arguments and get the default `Application` provider), but confirm both still pass no explicit provider after the change:
  - `source/lib/server/handlers/api/ApiEngineStopHandler.js`
  - `source/lib/server/handlers/engine/EngineStopHandler.js`
- Update `source/spec/lib/services/engine/EngineStopService_spec.js` to inject a test double `statusProvider` (with `isRunning`/`stop` spies) instead of `spyOn(Application, ...)` / `Application.reset()`.
- Update `docs/agents/worker.md`'s "Engine auxiliary services" section:
  - In the intro sentence above the table, correct "reaches into `Application`/`JobRegistry` directly" to just `Application` (the code never touches `JobRegistry`).
  - In the `EngineStopService` table row: correct the stale path to `source/lib/services/engine/EngineStopService.js`, and mark the injectable-provider note as done.

Out of scope: any change to `EngineEvents` or the `Engine` listener API (#718).

## Benefits

- `EngineStopService` becomes testable without spying on/resetting the `Application` singleton.
- Removes the last static-facade holdout among the "Engine auxiliary services", aligning `EngineStopService` with how `EngineController`, `LogBufferCollection`/`LogRegistry`, `ApplicationInstance`, and `RunReporter` already reach the engine.
- Keeps `docs/agents/worker.md` accurate for future agents consulting the "Engine auxiliary services" table.

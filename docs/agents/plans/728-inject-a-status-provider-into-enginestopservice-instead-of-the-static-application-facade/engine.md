# Engine Plan: Inject a status provider into EngineStopService instead of the static Application facade

Main plan: [plan.md](plan.md)

## Shared contracts

`EngineStopService.stop()` gains a `statusProvider = Application` default parameter (any object exposing `isRunning()`/`stop()`). No path change — stays at `source/lib/services/engine/EngineStopService.js`. `architect` reads this final shape (or this plan) to write `docs/agents/worker.md`'s corrected row; no code-level dependency runs the other way.

## Implementation Steps

### Step 1 — Add the injectable status provider

Change `source/lib/services/engine/EngineStopService.js`'s `stop()` from a bare static call into `static stop(statusProvider = Application)`, replacing every internal `Application.` reference with `statusProvider.`. Keep the class fully static (no constructor, no instance state) — this is a default-parameter injection, not a conversion to an instance class. `Application` stays imported (it's now only the default value).

Do not change `source/lib/server/handlers/api/ApiEngineStopHandler.js` or `source/lib/server/handlers/engine/EngineStopHandler.js` — both call `EngineStopService.stop()` with no arguments today, and the new default parameter keeps that call working unchanged. Just double-check, while editing, that neither passes an argument already (they don't, per the current code).

### Step 2 — Update the spec to inject a test double

In `source/spec/lib/services/engine/EngineStopService_spec.js`, replace `spyOn(Application, 'stop')` / `spyOn(Application, 'isRunning')` / the `Application.reset()` `afterEach` with a plain test-double object (e.g. `{ isRunning: jasmine.createSpy(), stop: jasmine.createSpy() }`) passed explicitly as `EngineStopService.stop(statusProvider)` in each spec. This removes the need to touch the real `Application` singleton at all in this spec file.

Also add (or confirm coverage of) a spec asserting that calling `EngineStopService.stop()` with no argument still works against the real `Application` default — a single case exercising the default parameter path is enough; it doesn't need to duplicate every existing case.

## Files to Change

- `source/lib/services/engine/EngineStopService.js` — add `statusProvider = Application` default parameter to `stop()`, use it instead of the static `Application` import inside the method body.
- `source/spec/lib/services/engine/EngineStopService_spec.js` — inject a test-double `statusProvider` instead of spying on/resetting `Application`; add one case covering the default-parameter path.

## CI Checks

- `source`: `docker compose run --rm navi_tests bash -c "yarn coverage && yarn lint && yarn report"` (CI jobs: `jasmine`, `checks`)

## Notes

- `ApiEngineStopHandler.js` and `EngineStopHandler.js` need no code changes — verified both call `EngineStopService.stop()` with zero arguments.

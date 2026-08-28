# Engine Plan: Migrate EngineEvents subscribers to Engine listener API and remove EngineEvents

Main plan: [plan.md](plan.md)

## Shared contracts

Depends on `worker`'s `Engine#on(eventName, handler)` / `Engine#emit(eventName, ...args)` (see [worker.md](worker.md)) — do not start until that API exists (or stub it locally against the documented contract if implementing in parallel). This plan is the sole consumer of that API: `EngineController` emits `'stop'`/`'start'`/`'finish'` on `this.engine`; `ApplicationInstance` subscribes to `'stop'`/`'finish'` once, right after building the engine.

## Steps

- [01 — Add clearBuffers to the log registry and drop LogBufferCollection's self-subscription](engine/01-log-registry-clear-buffers.md)
- [02 — Switch EngineController to the instance-scoped Engine API and add the 'finish' event](engine/02-engine-controller-listener-api.md)
- [03 — Wire the 'stop'/'finish' listeners in ApplicationInstance](engine/03-application-instance-wiring.md)
- [04 — Delete EngineEvents and its dead references](engine/04-delete-engine-events.md)
- [05 — Update affected specs](engine/05-update-specs.md)

## CI Checks

- `source`: `npm run coverage` (CI job: `jasmine`)
- `source`: `npm run lint` (CI job: `checks`)

## Notes

- Steps 01 and 02 are independent of each other and can be done in either order; step 03 depends on both; step 04 depends on 01–03 (nothing may still reference `EngineEvents`); step 05 should be done alongside 01–04, not deferred to the end, since several of those specs currently assert the very behavior being replaced.
- `EngineStopService`'s static-`Application`-import cleanup is explicitly out of scope here — tracked separately as [#728](https://github.com/darthjee/navi/issues/728).

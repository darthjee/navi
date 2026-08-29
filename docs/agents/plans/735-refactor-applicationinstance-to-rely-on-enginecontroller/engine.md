# Engine Plan: Refactor ApplicationInstance to rely on EngineController

Main plan: [plan.md](plan.md)

## Steps

- [01 — Add buildEngine and bind to EngineController](engine/01-add-buildengine-and-bind.md)
- [02 — Add build and launch to EngineController](engine/02-add-build-and-launch.md)
- [03 — Update ApplicationInstance.run() to use EngineController.build/launch](engine/03-update-applicationinstance-run.md)
- [04 — Update specs for both classes](engine/04-update-specs.md)

## CI Checks
- `source`: `npm run coverage` (CI job: `jasmine`)
- `source`: lint via `scripts/ci.sh lint-and-report source` (CI job: `checks`)

## Notes
- Behavior must stay identical: this is a pure internal wiring refactor, `ApplicationInstance`'s public API (`pause`, `stop`, `continue`, `start`, `restart`, `reload`, `shutdown`, `status`, `isRunning`, `isPaused`, `isStopped`, `setStatus`) is untouched.
- `EngineController` gains new imports (`Engine`, `LogRegistry`, `NamespaceMap`, `ConfigIncluder`) it didn't have before — expected per the issue's resolved scope discussion, not an oversight.
- `WebServer` construction/lifecycle stays on `ApplicationInstance` — do not touch `buildWebServer()` or `this.webServer` handling; that is explicitly deferred to #736.
- `PromiseAggregator` usage (`this.#aggregator`) stays as-is on `ApplicationInstance` — deferred to #737.

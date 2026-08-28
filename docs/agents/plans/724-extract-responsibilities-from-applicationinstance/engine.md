# Engine Plan: Extract responsibilities from ApplicationInstance

Main plan: [plan.md](plan.md)

## Steps

- [01 — Create EngineController](engine/01-create-engine-controller.md)
- [02 — Integrate EngineController into ApplicationInstance](engine/02-integrate-into-application-instance.md)
- [03 — Split the spec file](engine/03-split-specs.md)

## CI Checks

- `source`: `npm run coverage` (CI job: `jasmine`)
- `source`: `npm run lint` (CI job: `checks`)

## Notes

- `EngineController` is constructed lazily inside `ApplicationInstance#run()` (once `config`/`sleepMs` are known), the same point where `engine`/`webServer` are currently built — not in `ApplicationInstance`'s own constructor. This mirrors today's timing: `pause()`/`stop()`/etc. already only make sense (and only work) once `run()` has executed, so gating `#engineController`'s existence on `run()` having been called changes nothing observable.
- The issue's "inject `ConfigHolder`" phrasing (Option A) refers to the existing `Config` model (`source/lib/models/configs/Config.js`, returned by `ApplicationConfigurator#load`) — there is no `ConfigHolder` class in the codebase to create or reuse. `EngineController` receives `ApplicationInstance`'s `this.config` value directly.
- `this.webServer` is not listed in the issue's "Shared Contracts to Resolve" section but has the exact same shape as `this.engine`: built in `run()`, only read by `shutdown()` (moving to `EngineController`). It needs the same post-boot injection as `engine`.
- `ApplicationInstance`'s existing public `engine`/`webServer` fields (not accessor-wrapped today) are kept as-is; `EngineController` gets the same kind of plain public settable fields for consistency with the current code style, rather than introducing setter methods that don't otherwise exist in this class.

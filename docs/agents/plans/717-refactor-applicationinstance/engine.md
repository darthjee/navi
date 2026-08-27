# Engine Plan: Refactor ApplicationInstance

## Overview
`source/lib/services/ApplicationInstance.js` (381 lines) mixes config loading, registry/job bootstrap, engine lifecycle, web server wiring, resource enqueueing, and run reporting into one class. This plan extracts four of those responsibilities into dedicated collaborator classes, injected into `ApplicationInstance` via constructor DI with independent defaults, leaving `ApplicationInstance` as a thin coordinator that only owns the engine lifecycle (state machine) plus wiring.

## Context
- New collaborators and what they absorb: `EngineState` (status value object + predicates), `RegistriesBuilder` (the `#initRegistries()` bootstrap block), `ApplicationConfigurator` (config loading), `RunReporter` (the reporting tail of `run()`).
- Public API is preserved via delegation — every spec in `source/spec/lib/services/ApplicationInstance_spec.js` and `Application_spec.js` must keep passing, including direct access to `instance.engine`, `instance.webServer`, `instance.config`, and `instance.setStatus`/`instance.status()` as plain strings.
- `EngineEvents` is explicitly **out of scope** for this plan — `LogBufferCollection` (`source/lib/common/utils/logging/LogBufferCollection.js:19`) is a real subscriber to its `'stop'` event, so it must stay wired exactly as today. Its eventual removal is tracked separately in issue [#718](https://github.com/darthjee/navi/issues/718).
- Full behavioral contract, edge cases, and naming rationale are documented in the issue file linked from [plan.md](plan.md) — read it before starting, this plan assumes it.

## Steps

- [01 — Extract EngineState](engine/01-extract-engine-state.md)
- [02 — Extract RegistriesBuilder](engine/02-extract-registries-builder.md)
- [03 — Extract ApplicationConfigurator](engine/03-extract-application-configurator.md)
- [04 — Extract RunReporter](engine/04-extract-run-reporter.md)
- [05 — Wire ApplicationInstance as thin coordinator](engine/05-wire-application-instance.md)

## CI Checks
- `source`: `npm run coverage` (CI job: `jasmine`)
- `source`: `npm run lint` (CI job: `checks`)

## Notes
- Steps 01–04 are independent of each other and can be done in any order; step 05 depends on all four being in place first.
- `EngineEvents` removal is explicitly out of scope here — see issue [#718](https://github.com/darthjee/navi/issues/718).
- Collaborator naming (`EngineState`, `RegistriesBuilder`, `ApplicationConfigurator`, `RunReporter`) is already confirmed final in the issue — no collisions in `source/lib/`.

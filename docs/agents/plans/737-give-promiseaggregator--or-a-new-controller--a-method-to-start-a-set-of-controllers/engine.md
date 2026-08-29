# Engine Plan: Give PromiseAggregator (or a new controller) a method to start a set of controllers

Main plan: [plan.md](plan.md)

## Steps

- [01 — Align EngineController's start contract with ServerController](engine/01-align-enginecontroller-start-contract.md)
- [02 — Add StartupCoordinator](engine/02-add-startupcoordinator.md)
- [03 — Wire StartupCoordinator into ApplicationInstance](engine/03-wire-startupcoordinator-into-applicationinstance.md)

## CI Checks

- `source`: `npm test` (CI job: `run-tests`, path `source`)
- `source`: `npm run lint` (CI job: `lint-and-report`, path `source`)

## Notes

- Do the contract-alignment step (01) before adding `StartupCoordinator` (02) — `StartupCoordinator.startAll()` assumes every controller exposes a no-arg `start()` returning a promise, and `EngineController` doesn't yet.
- `#enginePromise` is confirmed unused outside of `ApplicationInstance.run()` (no other reads in `source/` code or specs) — safe to delete outright in step 03, no compatibility shim needed.

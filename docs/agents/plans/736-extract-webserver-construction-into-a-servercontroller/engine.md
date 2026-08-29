# Engine Plan: Extract WebServer construction into a ServerController

Main plan: [plan.md](plan.md)

## Steps

- [01 — Create ServerController](engine/01-create-server-controller.md)
- [02 — Update EngineController to delegate through ServerController](engine/02-update-engine-controller.md)
- [03 — Update ApplicationInstance wiring](engine/03-update-application-instance.md)
- [04 — Remove Application's buildWebServer facade](engine/04-remove-application-facade-buildwebserver.md)
- [05 — Migrate existing specs](engine/05-migrate-existing-specs.md)

## CI Checks

- `source`: `npm run coverage` (CI job: `jasmine`)
- `source`: `npm run lint` (CI job: `checks`, via `scripts/ci.sh lint-and-report`)

## Notes

- Pure encapsulation refactor — no observable behavior change for callers. Every step should keep `npm run coverage` green in `source/`.
- Whether #737's future `PromiseAggregator.startAll()` also wants a uniform `shutdown()`/`stop()` contract across controllers is out of scope here and can be resolved when #737 itself is planned.

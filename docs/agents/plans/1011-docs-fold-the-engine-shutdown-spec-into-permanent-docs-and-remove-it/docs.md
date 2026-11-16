# Docs Plan: Docs: fold the engine-shutdown spec into permanent docs and remove it

Main plan: [plan.md](plan.md)

## Shared contracts

- Add the section `## Graceful shutdown` (anchor `#graceful-shutdown`) to `docs/guides/deku-swarm/running-the-engine.md`. Other docs link to it, so keep the title exact.
- Describe the shipped behaviour exactly as listed in [plan.md's Shared contracts](plan.md#shared-contracts): the return value, frozen promotion/allocation/idle tracking, `start()` resolving with work in flight, no cancellation, untouched queues, tick-granularity overshoot, and the edge cases.

## Steps

- [01 — Running-the-engine guide](docs/01-running-the-engine-guide.md)
- [02 — Reference table](docs/02-reference-table.md)
- [03 — README Engine section](docs/03-readme-engine-section.md)

## Notes
- Do not touch `docs/agents/*`: the architect owns it.
- Before writing, check the exact behaviour in `deku-swarm/lib/services/Engine.js` and don't guess. The shared contract above was verified against it.
- `docs/guides/HOW_TO_USE_DEKU_SWARM.md` only needs a change if its index description of "Running the Engine" should mention graceful shutdown. A short phrase is enough.

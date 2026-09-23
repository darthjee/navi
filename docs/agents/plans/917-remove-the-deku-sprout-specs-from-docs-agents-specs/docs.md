# Docs Plan: Remove the deku-sprout specs from docs/agents/specs

Main plan: [plan.md](plan.md)

## Shared contracts

- Public API: `BaseLogger`, `ConsoleLogger`, `LoggerGroup`, `Logger`, imported as `import { Logger } from 'deku-sprout'`.
- Consumers: `source/`, `dev/app` (via `file:../logger`) and `clients/node/` (via npm `^0.1.0`).
- Release tags are `deku-sprout-X.Y.Z`.

## Implementation Steps

### Step 1 — Make `logger/README.md` describe the released package
- Remove the `## Status` section ("still being scaffolded — no logging classes are published yet") and its link to `../docs/agents/specs/deku-sprout.md`.
- Rewrite the intro in the present tense. `deku-sprout` *is* the shared logging package, extracted from the code that used to be duplicated between `source/` and `clients/node/`.
- Add a short usage section: the four exported classes, with a minimal example. Check the constructor and method signatures against `logger/lib/*.js`, and use `worker/README.md` as the model for tone and length.
- Keep the Installation and "Source & Documentation" sections. Don't link into `docs/agents/`, since this README is npm-facing.

## Files to Change
- `logger/README.md`: drop the stale status and the spec link, and add a real description and usage section

## Notes
- Only the README changes here. `logger/lib` belongs to `logger`, and `docs/agents/*` belongs to `architect`.

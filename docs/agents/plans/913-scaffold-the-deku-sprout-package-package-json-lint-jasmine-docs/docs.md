# Docs Plan: Scaffold the deku-sprout package (package.json, lint, jasmine, docs)

Main plan: [plan.md](plan.md)

## Shared contracts

- Package name `deku-sprout`. Mirror `worker/README.md`'s public-facing `npm install deku-swarm` line as `npm install deku-sprout` — consumers install the published package via npm; `yarn` is only this repo's own local-dev convention (`logger` uses it inside `logger/`).
- `logger/lib/index.js` has no exports yet — do not document any class or usage example. `logger` confirms the real classes land in #914.

## Implementation Steps

### Step 1 — `logger/README.md`
Write the npm-facing readme for `deku-sprout`, mirroring `worker/README.md`'s structure (title, one-line tagline, `## Installation` with `npm install deku-sprout`), but scoped to what actually exists right now:
- State plainly that the package is still being scaffolded — no logging classes are published yet.
- Link to `docs/agents/specs/deku-sprout.md` for what's coming.
- Omit `worker/README.md`'s "Library usage" and class-reference sections entirely — there is nothing to demonstrate yet.

## Files to Change
- `logger/README.md` — new

## Notes
- Full usage documentation (installation walkthrough plus code samples) is written once the real classes exist, in #914 — keep this version intentionally minimal.

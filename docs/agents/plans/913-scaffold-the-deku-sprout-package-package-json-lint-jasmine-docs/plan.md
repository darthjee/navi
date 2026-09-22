# Plan: Scaffold the deku-sprout package (package.json, lint, jasmine, docs)

Issue: [913-scaffold-the-deku-sprout-package-package-json-lint-jasmine-docs.md](../../issues/913-scaffold-the-deku-sprout-package-package-json-lint-jasmine-docs.md)

## Overview
Part 3 of 7 of #888. Scaffold `logger/` into a runnable, tested, linted `deku-sprout` package skeleton — tooling and config only, no logging classes yet (those are extracted in #914) — mirroring `worker/`'s (`deku-swarm`) own setup. `logger` builds the package itself; `docs` writes the npm-facing `logger/README.md`; the architect (this plan's coordinator) writes the permanent internal doc as a stub and updates the folder-structure reference directly, since both are `docs/agents/*` files outside every specialist's scope.

## Agents involved

- [logger](logger.md)
- [docs](docs.md)

## Shared contracts

- Package name: `deku-sprout`, starting `version: "0.1.0"` (a fresh start — no prior in-repo history to carry over, unlike `worker/package.json`'s inherited `1.6.2`), `main: "lib/index.js"`.
- `logger/lib/index.js` has **no exports yet** — the real `BaseLogger`/`ConsoleLogger`/`LoggerGroup`/`Logger` classes land in #914. `docs` must not document any class or usage example in `logger/README.md`; state plainly that the package is still scaffolding.
- Commands that must all succeed inside `logger/` once `logger`'s work is done: `yarn install`, then `yarn test` and `yarn lint`. `docs` mirrors `worker/README.md`'s public-facing `npm install deku-sprout` for the published-package install line (yarn is this repo's own local-dev convention, not npm's install story for consumers).

## Architect Steps

1. Create `docs/agents/logger.md` as a stub, named after the folder (matching the `docs/agents/worker.md` convention, not the package name) — a short package-purpose paragraph mirroring `docs/agents/worker.md`'s intro, the current scaffolding status, a link to `logger/README.md` and to `docs/agents/specs/deku-sprout.md`, and an explicit note that the full class-by-class reference lands in #914. Do not attempt a `worker.md`-style class-by-class section — no classes exist yet.
2. Update `docs/agents/folder-structure.md`'s `logger/` row: replace "Currently an empty folder kept with a `.gitkeep`" with a note that the package is now scaffolded (tooling and config in place) but still has no logging classes.

### Files to Change (architect)
- `docs/agents/logger.md` — new stub
- `docs/agents/folder-structure.md` — update the `logger/` row

## Notes
- No CI wiring in this issue: `.circleci/config.yml` has no `logger`/`deku-sprout` jobs yet, and none are added here — that's #915 (CI and release flow). Verify locally instead.
- Do not touch `scripts/bump_version.sh` or the root `README.md`'s version badges — also #915.

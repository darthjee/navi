# Issue: Scaffold the deku-sprout package (package.json, lint, jasmine, docs)

## Description
Part 3 of 7 of #888. Scaffold the `deku-sprout` package skeleton in `logger/` — tooling, config and docs only, no logging classes yet (those are extracted in #914) — mirroring how `worker/` (`deku-swarm`) is set up.

## Solution
In `logger/`:
- `package.json`: name `deku-sprout`, `version: 0.1.0` (fresh start, no prior history to carry over, unlike the `1.6.2` starting point `worker/package.json` inherited), `type: module`, `main: lib/index.js`, `files: ["lib"]`, `author`/`license`/`description`/`readme` matching `worker/package.json` (`deku-swarm`), scripts `spec`/`test`/`coverage`/`lint`/`lint_fix`/`lint_report`/`report`, and `devDependencies`/`c8` config mirroring `worker/package.json`.
- `eslint.config.mjs` mirroring `worker/eslint.config.mjs`.
- `spec/support/jasmine.json` mirroring `worker/spec/support/jasmine.json`.
- `.gitignore` (`node_modules/`, `coverage/`, `report/`), matching `worker/.gitignore`.
- An empty `lib/index.js` (no exports yet — populated by #914) and a first spec proving the Jasmine + c8 + lint setup runs end-to-end.
- `logger/README.md` (npm-facing, owned by `docs`).
- `docs/agents/logger.md` (named after the folder, matching the `docs/agents/worker.md` convention) as a stub for now — package purpose, scaffolding status, and a link to the `deku-sprout` specs — with the full class-by-class reference deferred to #914, once the extracted classes actually exist.
- The `docs/agents/folder-structure.md` update marking `logger/` as scaffolded.

The package must be runnable on its own (`yarn install`, then `yarn test` and `yarn lint`, inside `logger/`).

## Benefits
- A tested, linted, documented package skeleton ready to receive the extracted logging code in #914.

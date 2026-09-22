# Logger Plan: Scaffold the deku-sprout package (package.json, lint, jasmine, docs)

Main plan: [plan.md](plan.md)

## Shared contracts

- Package name `deku-sprout`, starting `version: "0.1.0"`, `main: "lib/index.js"`. `lib/index.js` exports nothing yet — `docs` must not describe class usage in `logger/README.md` until #914.
- `yarn install`, then `yarn test` and `yarn lint`, must all succeed inside `logger/` once this step is done — `docs` references exactly these three commands in `logger/README.md`.

## Implementation Steps

### Step 1 — `package.json`, ESLint and Jasmine config
Mirror `worker/package.json` (`deku-swarm`) into `logger/package.json`:
- `name: "deku-sprout"`, `version: "0.1.0"`, `type: "module"`, `description`, `readme: "README.md"`, `main: "lib/index.js"`, `files: ["lib"]`.
- Scripts: `spec`, `test`, `coverage`, `lint`, `lint_fix`, `lint_report`, `report` — copy verbatim from `worker/package.json`.
- `author: "darthjee"`, `license: "MIT"`.
- `devDependencies` and the `c8` config block copied verbatim from `worker/package.json`.

Create `logger/eslint.config.mjs` as an exact copy of `worker/eslint.config.mjs` (same plugins and rules — `@eslint/js`, `eslint-plugin-import`, `eslint-plugin-jasmine`, `eslint-plugin-sort-class-members`, `globals`).

Create `logger/spec/support/jasmine.json` as an exact copy of `worker/spec/support/jasmine.json` (`spec_dir: "spec"`, `spec_files: ["**/*[sS]pec.js"]`, `random: true`).

Create `logger/.gitignore` with `node_modules/`, `coverage/`, `report/` (matching `worker/.gitignore`). Remove the now-superseded `logger/.gitkeep` — the folder no longer needs a placeholder once real files exist inside it.

### Step 2 — Empty entrypoint and a smoke spec
Create `logger/lib/index.js` — empty for now, no exports. The real `BaseLogger`, `ConsoleLogger`, `LoggerGroup` and `Logger` classes are extracted into it by #914.

Add a first spec, `logger/spec/index_spec.js`, that imports `logger/lib/index.js` and makes a trivial assertion (e.g. the module loads and exports an object) — just enough to prove the Jasmine + c8 + ESLint pipeline runs end-to-end with nothing real to test yet.

## Files to Change
- `logger/package.json` — new
- `logger/eslint.config.mjs` — new
- `logger/spec/support/jasmine.json` — new
- `logger/.gitignore` — new
- `logger/lib/index.js` — new (empty)
- `logger/spec/index_spec.js` — new (smoke spec)
- `logger/.gitkeep` — removed (superseded by real files)

## CI Checks
No `logger`-specific CircleCI jobs exist yet (`jasmine-logger`/`checks-logger`/`check-and-publish-logger` land in #915) — nothing to add to `.circleci/config.yml` here. Verify locally instead:
- `logger/`: `cd logger && yarn install && yarn test && yarn lint`

## Notes
- Do not add real logging classes here — that's #914.
- Do not touch `.circleci/config.yml`, `scripts/bump_version.sh`, or the root `README.md`'s version badges — that's #915 (release flow).

# Engine Plan: Reduce the size of MenuConfig_spec.js

Main plan: [plan.md](plan.md)

## Overview
`source/spec/lib/models/configs/MenuConfig_spec.js` is 322 lines, so the spec size check reports it as WARN. Shrink it and split it so every resulting spec is under 300 lines. Every behavior must still be asserted.

## Context
- The spec builds a temp dir per example with `mkdtempSync`/`rmSync` and has a local `write(lines)` helper that joins lines and writes `menu.yml`. It also has a `rendered(path)` helper that maps `MenuConfig.fromFile(path)` to `toJSON()`, plus the `LOGS`/`MEMORY` expected-entry constants.
- `.fromFile` has about 17 `describe` blocks. Six of them assert the same result (`[LOGS, MEMORY]`) for different "empty-ish" inputs: missing file, empty, whitespace-only, fully commented out, a document with neither `entries` nor `defaults`, and `entries: []`.
- The rest mix parse-level behavior (defaults flag, invalid YAML, `entries` not a list, env interpolation, custom entries) with merge behavior (hidden entries, repositioning/relabeling defaults, duplicate routes, default-label reuse, malformed entry among valid ones).
- Support helpers follow a static-class style with JSDoc (`LoggerUtils`, `RegistryCleanupUtils`, `FixturesUtils`) in `source/spec/support/utils/`. Split specs use the `<Class>_<topic>_spec.js` naming, e.g. `Client_emit_spec.js`, `Config_fromFile_spec.js`.
- `source/spec/support/fixtures/menu/` already holds `menu.yml`/`menu_invalid.yml`, and `FixturesUtils.getFixturePath` resolves them. Most scenarios here are small inline documents, though, so a temp-file util keeps each scenario's YAML visible next to its assertion. Only reuse fixtures where they match a scenario exactly.

## Steps

- [01 — Extract MenuConfigFileUtils](engine/01-extract-menu-config-file-utils.md)
- [02 — Table-drive the default-entries cases](engine/02-table-drive-default-cases.md)
- [03 — Split merge behavior into MenuConfig_merge_spec.js](engine/03-split-merge-spec.md)

## CI Checks
- `source`: `cd source && npm run coverage` (CI job: `jasmine`)
- `source`: `scripts/ci.sh lint-and-report source`, i.e. `npm run lint` + `npm run report`, which includes the spec size check (CI job: `checks`)

## Notes
- The split file name `MenuConfig_merge_spec.js` follows the repo's `<Class>_<topic>_spec.js` convention instead of the issue's suggested `MenuConfigMerge_spec.js`. The issue leaves naming to the implementer.
- Keep every existing assertion, including the `Logger.warn` message strings and the `MenuEntry` instance check. Only the structure changes.
- The env-interpolation scenario must still clean up `process.env.MENU_SPEC_TEXT` in a `finally`, or in an `afterEach`.

# Issue: Reduce the size of MenuConfig_spec.js

## Description
The spec size check reports `source/spec/lib/models/configs/MenuConfig_spec.js` as **WARN** with 322 lines.

## Problem
- The spec writes temporary YAML files inline (`mkdtempSync`/`writeFileSync`/`rmSync`), and `.fromFile` has about 17 scenarios in one block.
- It mixes parsing edge cases (missing, empty, whitespace-only, commented-out file, invalid YAML) with merge behavior (defaults, hidden, repositioning, duplicates).

## Expected Behavior
- Every resulting spec file is under 300 lines (the size check reports no WARN/ERROR for it).
- No test coverage is lost: the same behaviors are asserted, and `yarn spec` and `yarn lint` stay green in `source/`.
- New shared helpers live in `source/spec/support/` (`factories/`, `utils/` or `dummies/`), following the style of the existing ones (`ResourceRequestFactory`, `AxiosUtils`, `LoggerUtils`, `JobLifecycleExamples`, ...).

## Solution
- Move the temporary YAML file handling into a support util (e.g. `MenuConfigFileUtils`), or use fixtures under `source/spec/support/fixtures/menu/`. That folder already exists (`menu.yml`, `menu_invalid.yml`), and `FixturesUtils` already resolves fixture paths, so reuse them where it fits.
- Drive the "empty-ish file → default entries" cases from one example table.
- If it is still over the limit, split into `MenuConfig_spec.js` (statics and parsing edge cases) and `MenuConfigMerge_spec.js` (merge behavior).

The split and file names above are suggestions. The implementer can pick a different split, or extract helpers, whichever keeps the specs readable.

## Benefits
- Specs that are easier to read and navigate
- Reusable setup instead of long local helpers
- The spec size check stops flagging this file

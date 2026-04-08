# Plan: Review and reorganize folders in source/lib and source/specs

## Overview

Move all spec files from `source/spec/<category>/` into `source/spec/lib/<category>/` so that
the spec tree mirrors the `source/lib/` tree and is clearly separated from `source/spec/support/`.
Update all import paths inside the moved files. No production code is changed.

## Context

Currently there are 55 spec files spread across 7 subfolders directly under `source/spec/`:

| Subfolder | Files |
|-----------|-------|
| `exceptions/` | 5 |
| `factories/` | 3 |
| `models/` | 11 |
| `registry/` | 5 |
| `server/` | 5 |
| `services/` | 7 |
| `utils/` | 19 |

These sit at the same level as `source/spec/support/`, making it hard to distinguish spec files
from test helpers at a glance.

The Jasmine configuration in `source/package.json` uses `spec_dir: "spec"` with
`spec_files: ["**/*[sS]pec.js"]`, which is already recursive and will discover files under
`spec/lib/` without any change. The npm scripts (`npx jasmine spec/**/*.js`) also use a recursive
glob that covers the new location.

## Target structure

```
source/spec/
  lib/
    exceptions/   ← was source/spec/exceptions/
    factories/    ← was source/spec/factories/
    models/       ← was source/spec/models/
    registry/     ← was source/spec/registry/
    server/       ← was source/spec/server/
    services/     ← was source/spec/services/
    utils/        ← was source/spec/utils/
  support/        ← unchanged
```

## Import path changes

Each moved spec file gains one extra folder level (`lib/`), so all relative imports shift by one:

| Import target | Before | After |
|---------------|--------|-------|
| `source/lib/…` | `../../lib/…` | `../../../lib/…` |
| `source/spec/support/…` | `../support/…` | `../../support/…` |

## Implementation Steps

### Step 1 — Move the files

Move all 55 spec files from `source/spec/<category>/` to `source/spec/lib/<category>/`,
preserving the subfolder structure.

### Step 2 — Update import paths in every moved file

For each moved file, update every relative import:
- `../../lib/` → `../../../lib/`
- `../support/` → `../../support/`

### Step 3 — Verify jasmine and npm scripts

Confirm that `yarn spec`, `yarn test`, and `yarn coverage` still discover and run all specs
without changes to configuration. The existing `spec_files: ["**/*[sS]pec.js"]` glob already
covers the new location.

### Step 4 — Run lint and tests

Run `yarn lint` and `yarn test` inside the container to verify no regressions.

## Files to Change

- All 55 spec files: moved from `source/spec/<category>/` to `source/spec/lib/<category>/`
  and imports updated.
- `source/package.json`: no change expected (glob already recursive).

## CI Checks

Before opening a PR, run inside the `navi_app` container:
- `cd source; yarn lint` (CircleCI job: `checks`)
- `cd source; yarn test` (CircleCI job: `jasmine`)

## Notes

- No production code (`source/lib/`) is changed.
- `source/spec/support/` stays exactly where it is.
- This is a pure rename/move — no logic changes.

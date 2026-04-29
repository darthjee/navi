# Plan: Reorganize Folders

## Overview

Reorganize the background job system within `source/lib/` into two dedicated folders:
- `source/lib/background/` — generic background infrastructure (extractable as a future standalone package)
- `source/lib/jobs/` — Navi-specific `Job` subclasses

No behavior changes. All imports, specs, and documentation must be updated to reflect the new locations.

## Context

The background job system has grown across `source/lib/models/`, `source/lib/factories/`, and `source/lib/registry/`, mixing generic infrastructure with Navi-specific logic. The reorganization separates these two concerns without changing any logic, enabling a future extraction of the generic background infrastructure into its own package.

## Folder Mapping

### `source/lib/background/` — Generic infrastructure

Moved from their current locations:

| File | Current location |
|------|-----------------|
| `Job.js` | `source/lib/models/` |
| `Worker.js` | `source/lib/models/` |
| `JobRegistry.js` | `source/lib/registry/` |
| `JobRegistryInstance.js` | `source/lib/registry/` |
| `WorkersRegistry.js` | `source/lib/registry/` |
| `WorkersRegistryInstance.js` | `source/lib/registry/` |
| `JobFactory.js` | `source/lib/factories/` |
| `WorkerFactory.js` | `source/lib/factories/` |

### `source/lib/jobs/` — Navi-specific Job subclasses

Moved from `source/lib/models/`:

| File |
|------|
| `ResourceRequestJob.js` |
| `ActionProcessingJob.js` |
| `HtmlParseJob.js` |
| `AssetDownloadJob.js` |

## Implementation Steps

### Step 1 — Create the new folders and move files

Create `source/lib/background/` and `source/lib/jobs/`. Move each file listed above to its new location.

### Step 2 — Update imports throughout the codebase

Update every `import` statement in `source/lib/` that references a moved file. This includes all files in `models/`, `services/`, `registry/`, `factories/`, `server/`, and the moved files themselves (which may import each other).

### Step 3 — Update specs

The spec tree under `source/spec/lib/` mirrors the source tree exactly. Move the spec files for each moved class to the corresponding new path:
- `source/spec/lib/models/<Class>_spec.js` → `source/spec/lib/background/<Class>_spec.js` or `source/spec/lib/jobs/<Class>_spec.js`
- `source/spec/lib/factories/<Class>_spec.js` → `source/spec/lib/background/<Class>_spec.js`
- `source/spec/lib/registry/<Class>_spec.js` → `source/spec/lib/background/<Class>_spec.js`

Update any imports inside those spec files and in any shared support files under `source/spec/support/` that reference moved classes.

### Step 4 — Update documentation

Update `docs/agents/architecture.md`:
- Remove the moved classes from their current sections (`models/`, `factories/`, `registry/`)
- Add new sections describing `background/` and `jobs/`

## Files to Change

- `source/lib/background/` — new folder with moved infrastructure files
- `source/lib/jobs/` — new folder with moved Navi-specific job files
- All files in `source/lib/` that import any of the moved classes
- `source/spec/lib/background/` — new spec folder mirroring `background/`
- `source/spec/lib/jobs/` — new spec folder mirroring `jobs/`
- All spec files that import moved classes
- `docs/agents/architecture.md` — updated folder descriptions

## Notes

- **Open question — enqueuers:** `ActionEnqueuer.js`, `ActionsEnqueuer.js`, and `AssetRequestEnqueuer.js` currently live in `source/lib/models/`. They do not extend `Job` but are tightly coupled to Navi-specific job types. Decision needed: do they stay in `models/`, or move to `jobs/`?
- **`Factory.js`:** The base `Factory` class in `source/lib/factories/` is used by `WorkerFactory`. Decision needed: does it stay in `factories/` or move to `background/`?
- This is a pure refactor — no logic changes. All tests should pass without modification to test logic.
- Run `yarn lint` and `yarn test` (via Docker) after each step to catch broken imports early.

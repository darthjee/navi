# Plan: Reorganize Folders

## Overview

Reorganize the background job system within `source/lib/` into four dedicated folders:

| Folder | Contents | Future extraction order |
|--------|----------|------------------------|
| `source/lib/factory/` | Base `Factory` class | 1st — dependency of both `background/` and Navi code |
| `source/lib/background/` | Generic background infrastructure | 2nd — depends on `factory/` |
| `source/lib/enqueuers/` | Navi-specific enqueuers | stays in Navi |
| `source/lib/jobs/` | Navi-specific `Job` subclasses | stays in Navi |

No behavior changes. All imports, specs, and documentation must be updated to reflect the new locations.

## Context

The background job system has grown across `source/lib/models/`, `source/lib/factories/`, and `source/lib/registry/`, mixing generic infrastructure with Navi-specific logic. The reorganization separates these two concerns without changing any logic, enabling a future extraction of the generic background infrastructure into its own package.

## Folder Mapping

### `source/lib/factory/` — Extractable base factory

| File | From |
|------|------|
| `Factory.js` | `source/lib/factories/` |

### `source/lib/background/` — Generic infrastructure

| File | From |
|------|------|
| `Job.js` | `source/lib/models/` |
| `Worker.js` | `source/lib/models/` |
| `JobRegistry.js` | `source/lib/registry/` |
| `JobRegistryInstance.js` | `source/lib/registry/` |
| `WorkersRegistry.js` | `source/lib/registry/` |
| `WorkersRegistryInstance.js` | `source/lib/registry/` |
| `JobFactory.js` | `source/lib/factories/` |
| `WorkerFactory.js` | `source/lib/factories/` |

### `source/lib/enqueuers/` — Navi-specific enqueuers

| File | From |
|------|------|
| `ActionEnqueuer.js` | `source/lib/models/` |
| `ActionsEnqueuer.js` | `source/lib/models/` |
| `AssetRequestEnqueuer.js` | `source/lib/models/` |

### `source/lib/jobs/` — Navi-specific Job subclasses

| File | From |
|------|------|
| `ResourceRequestJob.js` | `source/lib/models/` |
| `ActionProcessingJob.js` | `source/lib/models/` |
| `HtmlParseJob.js` | `source/lib/models/` |
| `AssetDownloadJob.js` | `source/lib/models/` |

## Implementation Steps

### Step 1 — Create the new folders and move files

Create `source/lib/factory/`, `source/lib/background/`, `source/lib/enqueuers/`, and `source/lib/jobs/`. Move each file listed above to its new location.

### Step 2 — Update imports throughout the codebase

Update every `import` statement in `source/lib/` that references a moved file. This includes all files in `models/`, `services/`, `registry/`, `factories/`, `server/`, and the moved files themselves (which may import each other).

### Step 3 — Update specs

The spec tree under `source/spec/lib/` mirrors the source tree exactly. Move spec files to their new mirrored paths:
- `source/spec/lib/factory/` — for `Factory_spec.js`
- `source/spec/lib/background/` — for Job, Worker, registries, and factory specs
- `source/spec/lib/enqueuers/` — for the three enqueuer specs
- `source/spec/lib/jobs/` — for the four Job subclass specs

Update any imports inside those spec files and in any shared support files under `source/spec/support/` that reference moved classes.

### Step 4 — Update documentation

Update `docs/agents/architecture.md`:
- Remove the moved classes from their current sections (`models/`, `factories/`, `registry/`)
- Add new sections describing `background/` and `jobs/`

## Files to Change

See [file_movements.md](file_movements.md) for the full source-to-destination table.

Additionally:
- All files in `source/lib/` that import any of the moved classes (import paths updated)
- All spec files that import moved classes (import paths updated)
- `docs/agents/architecture.md` — updated folder descriptions

## Notes

- This is a pure refactor — no logic changes. All tests should pass without modification to test logic.
- `factory/` must be extracted as a standalone package before `background/` can be extracted, since it is a shared dependency of both.
- Run `yarn lint` and `yarn test` (via Docker) after each step to catch broken imports early.

# Plan: Organize Folders in dev/app

## Overview
Reorganize `dev/app/lib/` by grouping files into responsibility-based subdirectories, mirroring the structure already in use in `source/lib/`. Update all imports throughout `dev/app/` source and spec files to reflect the new paths.

## Context
Currently `dev/app/lib/` has 14 files at the top level (plus two already-organized subdirectories: `config/` and `utils/`). The files span at least three distinct responsibilities — request handling, routing infrastructure, and data/model logic — making navigation harder than necessary. The main `source/lib/` already follows a clean subfolder-per-concern pattern that should be replicated here.

## Implementation Steps

### Step 1 — Define the target folder structure
Decide on the final set of subdirectories and which file goes where:

| New folder | Files to move |
|---|---|
| `lib/handlers/` | `CollectionHandler.js`, `ContentHandler.js`, `IndexRequestHandler.js`, `RedirectHandler.js`, `RequestHandler.js`, `not_found.js` |
| `lib/routing/` | `Router.js`, `RouteRegister.js`, `RouteParamsExtractor.js`, `routes.config.js`, `redirect_routes.config.js` |
| `lib/models/` | `DataNavigator.js`, `RedirectLocation.js`, `FailureSimulator.js`, `Serializer.js` |
| `lib/config/` | already in place — no move needed |
| `lib/utils/` | already in place — no move needed |

### Step 2 — Move the files
Move each file from `dev/app/lib/` to its target subfolder. No logic changes — pure relocation.

### Step 3 — Update imports in source files
Find every `import` statement in `dev/app/` (excluding `lib/config/` and `lib/utils/` which are already correct) that references a moved file and update the path to the new location.

### Step 4 — Update imports in spec files
Repeat the same import-path update for all files under `dev/app/spec/` (or wherever `dev/app` tests live).

### Step 5 — Verify
Run the dev/app test suite and linter to confirm nothing is broken after the reorganization.

## Files to Change
- `dev/app/lib/<moved files>` — relocated to subdirectories
- `dev/app/lib/handlers/` — new folder with handler files
- `dev/app/lib/routing/` — new folder with routing files
- `dev/app/lib/models/` — new folder with model/data files
- Any file in `dev/app/` or `dev/app/spec/` that imports a moved file — import paths updated

## Notes
- No logic changes in this issue — pure structural reorganization.
- `not_found.js` is a small utility but is request-handling related; placing it in `handlers/` is a reasonable default, but it could also go in `utils/` — confirm with the team if needed.
- The spec mirror structure (if any) under `dev/app/spec/` should follow the same subfolder layout as `lib/` after this change.

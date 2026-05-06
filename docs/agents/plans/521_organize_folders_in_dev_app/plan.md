# Plan: Organize Folders in dev/app

## Overview
Reorganize `dev/app/lib/` by grouping files into responsibility-based subdirectories, mirroring the structure already in use in `source/lib/`. Move the matching spec files to mirror the new layout, update all imports, and update `docs/agents/dev-app.md` to reflect the new structure.

## Context
Currently `dev/app/lib/` has 14 files at the top level (plus two already-organized subdirectories: `config/` and `utils/`). The files span three distinct responsibilities — request handling, routing infrastructure, and data/model logic — making navigation harder than necessary. The main `source/lib/` already follows a clean subfolder-per-concern pattern that should be replicated here. The spec tree under `dev/app/spec/lib/` is also flat and must mirror the new lib layout.

## Implementation Steps

### Step 1 — Move lib source files

| File | From | To |
|---|---|---|
| `CollectionHandler.js` | `lib/` | `lib/handlers/` |
| `ContentHandler.js` | `lib/` | `lib/handlers/` |
| `IndexRequestHandler.js` | `lib/` | `lib/handlers/` |
| `RedirectHandler.js` | `lib/` | `lib/handlers/` |
| `RequestHandler.js` | `lib/` | `lib/handlers/` |
| `not_found.js` | `lib/` | `lib/handlers/` |
| `Router.js` | `lib/` | `lib/routing/` |
| `RouteRegister.js` | `lib/` | `lib/routing/` |
| `RouteParamsExtractor.js` | `lib/` | `lib/routing/` |
| `routes.config.js` | `lib/` | `lib/routing/` |
| `redirect_routes.config.js` | `lib/` | `lib/routing/` |
| `DataNavigator.js` | `lib/` | `lib/models/` |
| `RedirectLocation.js` | `lib/` | `lib/models/` |
| `FailureSimulator.js` | `lib/` | `lib/models/` |
| `Serializer.js` | `lib/` | `lib/models/` |
| `config/AppConfig.js` | `lib/config/` | no move — already organized |
| `config/JsonConfig.js` | `lib/config/` | no move — already organized |
| `utils/EnvResolver.js` | `lib/utils/` | no move — already organized |

### Step 2 — Move spec files (mirror lib layout)

| File | From | To |
|---|---|---|
| `CollectionHandler_spec.js` | `spec/lib/` | `spec/lib/handlers/` |
| `ContentHandler_spec.js` | `spec/lib/` | `spec/lib/handlers/` |
| `IndexRequestHandler_spec.js` | `spec/lib/` | `spec/lib/handlers/` |
| `RedirectHandler_spec.js` | `spec/lib/` | `spec/lib/handlers/` |
| `RequestHandler_spec.js` | `spec/lib/` | `spec/lib/handlers/` |
| `Router_spec.js` | `spec/lib/` | `spec/lib/routing/` |
| `RouteRegister_spec.js` | `spec/lib/` | `spec/lib/routing/` |
| `RouteParamsExtractor_spec.js` | `spec/lib/` | `spec/lib/routing/` |
| `routes.config_spec.js` | `spec/lib/` | `spec/lib/routing/` |
| `DataNavigator_spec.js` | `spec/lib/` | `spec/lib/models/` |
| `RedirectLocation_spec.js` | `spec/lib/` | `spec/lib/models/` |
| `FailureSimulator_spec.js` | `spec/lib/` | `spec/lib/models/` |
| `Serializer_spec.js` | `spec/lib/` | `spec/lib/models/` |
| `config/AppConfig_spec.js` | `spec/lib/config/` | no move — already organized |
| `config/JsonConfig_spec.js` | `spec/lib/config/` | no move — already organized |
| `utils/EnvResolver_spec.js` | `spec/lib/utils/` | no move — already organized |

### Step 3 — Update imports in source files
Find every `import` statement in `dev/app/lib/` and `dev/app/app.js` that references a moved file and update the path to the new location.

### Step 4 — Update imports in spec files
Repeat the same import-path update for all files under `dev/app/spec/`.

### Step 5 — Update `docs/agents/dev-app.md`
Update the "Structure" section to reflect the new folder layout (replace the flat file list under `lib/` with the three new subdirectories and their contents).

### Step 6 — Verify
Run the dev/app test suite and linter to confirm nothing is broken.

## Files to Change
- `dev/app/lib/handlers/` — new folder: CollectionHandler, ContentHandler, IndexRequestHandler, RedirectHandler, RequestHandler, not_found
- `dev/app/lib/routing/` — new folder: Router, RouteRegister, RouteParamsExtractor, routes.config, redirect_routes.config
- `dev/app/lib/models/` — new folder: DataNavigator, RedirectLocation, FailureSimulator, Serializer
- `dev/app/spec/lib/handlers/` — new folder: matching handler specs
- `dev/app/spec/lib/routing/` — new folder: matching routing specs
- `dev/app/spec/lib/models/` — new folder: matching model specs
- `dev/app/app.js` — import paths updated
- Any `dev/app/lib/**/*.js` that imports a sibling file — import paths updated
- Any `dev/app/spec/**/*.js` that imports a lib file — import paths updated
- `docs/agents/dev-app.md` — Structure section updated

## CI Checks
Before opening a PR, run the following checks for the folders being modified:
- `dev/app`: `yarn test` (CircleCI job: `jasmine-dev`)
- `dev/app`: `yarn lint` (CircleCI job: `checks-dev`)

## Notes
- No logic changes in this issue — pure structural reorganization.
- `redirect_routes.config.js` has no matching spec file; no spec to move for it.

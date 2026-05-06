# Issue: Organize Folders in dev/app

## Description
The `dev/app/lib` directory mixes files with different responsibilities at the same level. Only `config/` and `utils/` subdirectories currently exist, while handlers, routing classes, and model/data classes all sit flat in `lib/`. The folder structure should be reorganized to reflect clear separation of concerns.

## Problem
- `lib/` contains a flat mix of request handlers, routing infrastructure, models, and configuration files
- Files with distinct responsibilities are not grouped, making navigation and maintenance harder
- Current flat layout:
  - Handlers: `CollectionHandler.js`, `ContentHandler.js`, `IndexRequestHandler.js`, `RedirectHandler.js`, `RequestHandler.js`
  - Routing: `Router.js`, `RouteRegister.js`, `RouteParamsExtractor.js`, `routes.config.js`, `redirect_routes.config.js`
  - Models/data: `DataNavigator.js`, `RedirectLocation.js`, `FailureSimulator.js`, `Serializer.js`
  - Misc: `not_found.js`
  - Already organized: `config/`, `utils/`

## Expected Behavior
- Files in `lib/` are grouped into subdirectories by responsibility, for example:
  - `lib/handlers/` — request handler classes
  - `lib/routing/` — router, route register, route params extractor, and route config files
  - `lib/models/` (or similar) — data/model classes such as `DataNavigator`, `RedirectLocation`, `FailureSimulator`, `Serializer`
- All imports across the `dev/app` codebase and its specs are updated to match the new paths

## Solution
- Decide on the target folder structure (handlers, routing, models, etc.)
- Move each file to its designated subfolder
- Update all `import`/`require` statements in `dev/app` source and spec files
- Verify tests pass after the reorganization

## Benefits
- Easier navigation and onboarding for new contributors
- Clear separation of concerns mirrors the organization already adopted in the main `source/` tree
- Reduces cognitive overhead when locating or adding files

---
See issue for details: https://github.com/darthjee/navi/issues/521

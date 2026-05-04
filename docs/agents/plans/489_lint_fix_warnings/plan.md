# Plan: Lint Fix Warnings

## Overview

Fix all JSDoc lint warnings in `source/lib/` by adding missing `@param` and `@returns` descriptions, and split two spec files in `source/spec/lib/` that exceed the 300-line limit.

## Context

Running `yarn lint` produces warnings across 13 source files due to missing JSDoc descriptions. Two spec files also trigger the `max-lines` rule (300-line limit). All warnings must be resolved so the lint step passes cleanly.

## Implementation Steps

### Step 1 — Fix JSDoc warnings in `source/lib/registry/`

Add missing `@param` and `@returns` descriptions to:
- `source/lib/registry/LogRegistry.js` (13 warnings)
- `source/lib/registry/LogRegistryInstance.js` (15 warnings)

Each flagged JSDoc block needs a description added to its `@param` tags (explaining the parameter purpose) and `@returns` tags (explaining what is returned).

### Step 2 — Fix JSDoc warnings in `source/lib/serializers/`

Add missing `@returns` description to:
- `source/lib/serializers/LogSerializer.js` (1 warning)

### Step 3 — Fix JSDoc warnings in `source/lib/server/`

Add missing `@param` and/or `@returns` descriptions to:
- `source/lib/server/JobLogsRequestHandler.js` (1 warning)
- `source/lib/server/JobsFilter.js` (1 warning)
- `source/lib/server/LogsRequestHandler.js` (1 warning)
- `source/lib/server/Router.js` (1 warning)
- `source/lib/server/SettingsRequestHandler.js` (1 warning)

### Step 4 — Fix JSDoc warnings in `source/lib/services/`

Add missing `@returns` description to:
- `source/lib/services/Engine.js` (1 warning)

### Step 5 — Fix JSDoc warnings in `source/lib/utils/logging/`

Add missing `@param` and/or `@returns` descriptions to:
- `source/lib/utils/logging/BufferedLogger.js` (1 warning)
- `source/lib/utils/logging/LogBuffer.js` (1 warning)
- `source/lib/utils/logging/LogBufferCollection.js` (1 warning)
- `source/lib/utils/logging/LogFilter.js` (2 warnings)

### Step 6 — Split `JobShowSerializer_spec.js`

`source/spec/lib/serializers/JobShowSerializer_spec.js` has 320 lines (limit: 300). Split it into two files by grouping related `describe` blocks. Both resulting files must stay under 300 lines and must be independently runnable by Jasmine.

### Step 7 — Split `RouteRegister_spec.js`

`source/spec/lib/server/RouteRegister_spec.js` has 353 lines (limit: 300). Split it into two or more files by grouping related `describe` or `it` blocks. All resulting files must stay under 300 lines and must be independently runnable.

### Step 8 — Verify

Run `yarn lint` inside Docker to confirm zero warnings remain.

## Files to Change

- `source/lib/registry/LogRegistry.js` — add `@param`/`@returns` descriptions
- `source/lib/registry/LogRegistryInstance.js` — add `@param`/`@returns` descriptions
- `source/lib/serializers/LogSerializer.js` — add `@returns` description
- `source/lib/server/JobLogsRequestHandler.js` — add `@param` description
- `source/lib/server/JobsFilter.js` — add `@returns` description
- `source/lib/server/LogsRequestHandler.js` — add `@param` description
- `source/lib/server/Router.js` — add `@param` description
- `source/lib/server/SettingsRequestHandler.js` — add `@param` description
- `source/lib/services/Engine.js` — add `@returns` description
- `source/lib/utils/logging/BufferedLogger.js` — add `@returns` description
- `source/lib/utils/logging/LogBuffer.js` — add `@returns` description
- `source/lib/utils/logging/LogBufferCollection.js` — add `@returns` description
- `source/lib/utils/logging/LogFilter.js` — add `@param`/`@returns` descriptions
- `source/spec/lib/serializers/JobShowSerializer_spec.js` — split into two files
- `source/spec/lib/server/RouteRegister_spec.js` — split into two or more files

## CI Checks

Before opening a PR, run the following checks for the folders being modified:
- `source/`: `docker-compose run --rm navi_app yarn lint` (linting)
- `source/`: `docker-compose run --rm navi_app yarn test` (unit tests, to confirm spec splits don't break anything)

## Notes

- Each logical group of changes (e.g., per-folder JSDoc fixes, each spec split) should ideally be a separate atomic commit.
- When splitting spec files, ensure each new file imports all shared helpers/factories it needs independently.
- The exact split boundary for spec files is not defined here — it should be determined by reading the actual file content and grouping related tests logically.

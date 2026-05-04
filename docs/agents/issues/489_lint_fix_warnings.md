# Issue: Lint Fix Warnings

## Description

Several JSDoc lint warnings exist across `lib/` source files that need to be fixed. The warnings are related to missing `@param` and `@returns` descriptions in JSDoc comments. Additionally, two spec files exceed the maximum allowed line count (300 lines) and should be split.

## Problem

- Missing JSDoc `@param` descriptions in multiple files
- Missing JSDoc `@returns` descriptions in multiple files
- Affected files:
  - `lib/registry/LogRegistry.js` — 13 warnings
  - `lib/registry/LogRegistryInstance.js` — 15 warnings
  - `lib/serializers/LogSerializer.js` — 1 warning
  - `lib/server/JobLogsRequestHandler.js` — 1 warning
  - `lib/server/JobsFilter.js` — 1 warning
  - `lib/server/LogsRequestHandler.js` — 1 warning
  - `lib/server/Router.js` — 1 warning
  - `lib/server/SettingsRequestHandler.js` — 1 warning
  - `lib/services/Engine.js` — 1 warning
  - `lib/utils/logging/BufferedLogger.js` — 1 warning
  - `lib/utils/logging/LogBuffer.js` — 1 warning
  - `lib/utils/logging/LogBufferCollection.js` — 1 warning
  - `lib/utils/logging/LogFilter.js` — 2 warnings
- Spec files exceeding maximum line count (300):
  - `spec/lib/serializers/JobShowSerializer_spec.js` (320 lines)
  - `spec/lib/server/RouteRegister_spec.js` (353 lines)

## Expected Behavior

- All JSDoc `@param` and `@returns` tags have proper descriptions
- All spec files are within the 300-line limit (split as needed)
- `yarn lint` passes with zero warnings

## Solution

- Add missing `@param` and `@returns` descriptions to all flagged JSDoc blocks in `lib/`
- Split `spec/lib/serializers/JobShowSerializer_spec.js` and `spec/lib/server/RouteRegister_spec.js` into smaller files to stay under the 300-line limit

## Benefits

- Cleaner, fully documented codebase
- Lint passes without warnings, reducing CI noise

---
See issue for details: https://github.com/darthjee/navi/issues/489

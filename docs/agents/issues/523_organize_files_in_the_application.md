# Issue: Organize Files in the Application

## Description
Several folders under `source/lib/` have grown too large and mix files of different responsibilities at the same level. They should be split into focused subfolders to improve navigation and maintainability.

## Problem
- `source/lib/models/` has 15 files covering config models, request models, and response-parsing utilities — all flat
- `source/lib/exceptions/` has 18 exception classes of different natures (HTTP errors, config errors, network errors, registry misses) — all flat
- `source/lib/server/` has 24 files mixing request handlers, routing infrastructure, filters, and the web server — all flat

## Expected Behavior

### `source/lib/models/`
Split into three subfolders:
- `models/configs/` — configuration models: `Config`, `FailureConfig`, `LogConfig`, `PaginationConfig`, `WebConfig`, `WorkersConfig`
- `models/request/` — request models: `AssetRequest`, `Resource`, `ResourceRequest`, `ResourceRequestAction`, `ResourceRequestPaginatedAction`
- `models/response/` — response-parsing models: `ParametersMapper`, `PathResolver`, `PathSegmentTraverser`, `ResponseParser`, `ResponseWrapper`

### `source/lib/exceptions/`
Split by error domain (exact subfolders to be defined during planning):
- HTTP/server errors: `ConflictError`, `ForbiddenError`, `NotFoundError`
- Config errors: `ConfigurationFileNotFound`, `ConfigurationFileNotProvided`, `MissingClientsConfig`, `MissingResourceConfig`, `MissingTopLevelConfgKey`
- Network/response errors: `InvalidHtmlResponseBody`, `InvalidResponseBody`, `NullResponse`, `RequestFailed`
- Registry/lookup errors: `ClientNotFound`, `ItemNotFound`, `ResourceNotFound`, `MissingActionResource`, `MissingMappingVariable`
- Base: `AppError` (may stay at `exceptions/` root as the shared base class)

### `source/lib/server/`
Split by responsibility (exact subfolders to be defined during planning):
- Request handlers: all `*RequestHandler` classes (potentially further grouped by domain, e.g. `handlers/engine/` for engine lifecycle handlers)
- Routing infrastructure: `Router`, `RouteRegister`, `PathValidator`, `WebServer`
- Utilities/filters: `JobsFilter`

## Solution
- For each folder, agree on the target subfolder structure
- Move files to their designated subfolders
- Update all `import` statements across `source/lib/`, `source/spec/`, and any other consumers
- Verify tests and lint pass after the reorganization

## Benefits
- Easier navigation — related files are co-located
- Mirrors the clean subfolder-per-concern pattern that `source/lib/utils/` already follows
- Reduces cognitive overhead when locating or adding files

---
See issue for details: https://github.com/darthjee/navi/issues/523

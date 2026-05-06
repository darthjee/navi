# Plan: Organize Files in the Application

## Overview
Reorganize three oversized flat folders in `source/lib/` — `models/`, `exceptions/`, and `server/` — into focused subfolders by responsibility. Move matching spec files to mirror the new layout, update all imports, and update `docs/agents/architecture.md`.

## Context
`source/lib/models/` (15 files), `source/lib/exceptions/` (18 files), and `source/lib/server/` (24 files) each mix files of different responsibilities at the same flat level. `source/lib/utils/` already follows the subfolder-per-concern pattern this issue aims to apply everywhere.

---

## Part 1 — `source/lib/models/`

### Target structure

| File | From | To |
|---|---|---|
| `Config.js` | `models/` | `models/configs/` |
| `FailureConfig.js` | `models/` | `models/configs/` |
| `LogConfig.js` | `models/` | `models/configs/` |
| `PaginationConfig.js` | `models/` | `models/configs/` |
| `WebConfig.js` | `models/` | `models/configs/` |
| `WorkersConfig.js` | `models/` | `models/configs/` |
| `AssetRequest.js` | `models/` | `models/request/` |
| `Resource.js` | `models/` | `models/request/` |
| `ResourceRequest.js` | `models/` | `models/request/` |
| `ResourceRequestAction.js` | `models/` | `models/request/` |
| `ResourceRequestPaginatedAction.js` | `models/` | `models/request/` |
| `ParametersMapper.js` | `models/` | `models/response/` |
| `PathResolver.js` | `models/` | `models/response/` |
| `PathSegmentTraverser.js` | `models/` | `models/response/` |
| `ResponseParser.js` | `models/` | `models/response/` |
| `ResponseWrapper.js` | `models/` | `models/response/` |

### Matching spec moves (`source/spec/lib/models/`)

| File | From | To |
|---|---|---|
| `Config_fromFile_spec.js` | `spec/lib/models/` | `spec/lib/models/configs/` |
| `Config_getClient_spec.js` | `spec/lib/models/` | `spec/lib/models/configs/` |
| `Config_getResource_spec.js` | `spec/lib/models/` | `spec/lib/models/configs/` |
| `FailureConfig_spec.js` | `spec/lib/models/` | `spec/lib/models/configs/` |
| `LogConfig_spec.js` | `spec/lib/models/` | `spec/lib/models/configs/` |
| `PaginationConfig_spec.js` | `spec/lib/models/` | `spec/lib/models/configs/` |
| `WebConfig_spec.js` | `spec/lib/models/` | `spec/lib/models/configs/` |
| `WorkersConfig_spec.js` | `spec/lib/models/` | `spec/lib/models/configs/` |
| `AssetRequest_spec.js` | `spec/lib/models/` | `spec/lib/models/request/` |
| `Resource_spec.js` | `spec/lib/models/` | `spec/lib/models/request/` |
| `ResourceRequest_spec.js` | `spec/lib/models/` | `spec/lib/models/request/` |
| `ResourceRequestAction_spec.js` | `spec/lib/models/` | `spec/lib/models/request/` |
| `ResourceRequestPaginatedAction_spec.js` | `spec/lib/models/` | `spec/lib/models/request/` |
| `ParametersMapper_spec.js` | `spec/lib/models/` | `spec/lib/models/response/` |
| `PathResolver_spec.js` | `spec/lib/models/` | `spec/lib/models/response/` |
| `PathSegmentTraverser_spec.js` | `spec/lib/models/` | `spec/lib/models/response/` |
| `ResponseParser_spec.js` | `spec/lib/models/` | `spec/lib/models/response/` |
| `ResponseWrapper_spec.js` | `spec/lib/models/` | `spec/lib/models/response/` |

---

## Part 2 — `source/lib/exceptions/`

### Target structure

| File | From | To |
|---|---|---|
| `AppError.js` | `exceptions/` | `exceptions/` (stays at root — shared base) |
| `ConflictError.js` | `exceptions/` | `exceptions/http/` |
| `ForbiddenError.js` | `exceptions/` | `exceptions/http/` |
| `NotFoundError.js` | `exceptions/` | `exceptions/http/` |
| `ConfigurationFileNotFound.js` | `exceptions/` | `exceptions/config/` |
| `ConfigurationFileNotProvided.js` | `exceptions/` | `exceptions/config/` |
| `MissingClientsConfig.js` | `exceptions/` | `exceptions/config/` |
| `MissingResourceConfig.js` | `exceptions/` | `exceptions/config/` |
| `MissingTopLevelConfgKey.js` | `exceptions/` | `exceptions/config/` |
| `InvalidHtmlResponseBody.js` | `exceptions/` | `exceptions/request/` |
| `InvalidResponseBody.js` | `exceptions/` | `exceptions/request/` |
| `NullResponse.js` | `exceptions/` | `exceptions/request/` |
| `RequestFailed.js` | `exceptions/` | `exceptions/request/` |
| `ClientNotFound.js` | `exceptions/` | `exceptions/registry/` |
| `ItemNotFound.js` | `exceptions/` | `exceptions/registry/` |
| `ResourceNotFound.js` | `exceptions/` | `exceptions/registry/` |
| `MissingActionResource.js` | `exceptions/` | `exceptions/registry/` |
| `MissingMappingVariable.js` | `exceptions/` | `exceptions/registry/` |

### Matching spec moves (`source/spec/lib/exceptions/`)

| File | From | To |
|---|---|---|
| `ConflictError_spec.js` | `spec/lib/exceptions/` | `spec/lib/exceptions/http/` |
| `NotFoundError_spec.js` | `spec/lib/exceptions/` | `spec/lib/exceptions/http/` |
| `InvalidHtmlResponseBody_spec.js` | `spec/lib/exceptions/` | `spec/lib/exceptions/request/` |
| `InvalidResponseBody_spec.js` | `spec/lib/exceptions/` | `spec/lib/exceptions/request/` |
| `NullResponse_spec.js` | `spec/lib/exceptions/` | `spec/lib/exceptions/request/` |
| `MissingActionResource_spec.js` | `spec/lib/exceptions/` | `spec/lib/exceptions/registry/` |
| `MissingMappingVariable_spec.js` | `spec/lib/exceptions/` | `spec/lib/exceptions/registry/` |

---

## Part 3 — `source/lib/server/`

### Target structure

| File | From | To |
|---|---|---|
| `EngineContinueRequestHandler.js` | `server/` | `server/handlers/engine/` |
| `EnginePauseRequestHandler.js` | `server/` | `server/handlers/engine/` |
| `EngineRestartRequestHandler.js` | `server/` | `server/handlers/engine/` |
| `EngineShutdownRequestHandler.js` | `server/` | `server/handlers/engine/` |
| `EngineStartRequestHandler.js` | `server/` | `server/handlers/engine/` |
| `EngineStatusRequestHandler.js` | `server/` | `server/handlers/engine/` |
| `EngineStopRequestHandler.js` | `server/` | `server/handlers/engine/` |
| `JobLogsRequestHandler.js` | `server/` | `server/handlers/jobs/` |
| `JobRequestHandler.js` | `server/` | `server/handlers/jobs/` |
| `JobRetryRequestHandler.js` | `server/` | `server/handlers/jobs/` |
| `JobsRequestHandler.js` | `server/` | `server/handlers/jobs/` |
| `AssetsRequestHandler.js` | `server/` | `server/handlers/` |
| `BaseUrlsRequestHandler.js` | `server/` | `server/handlers/` |
| `IndexRequestHandler.js` | `server/` | `server/handlers/` |
| `LogsRequestHandler.js` | `server/` | `server/handlers/` |
| `SettingsRequestHandler.js` | `server/` | `server/handlers/` |
| `StatsRequestHandler.js` | `server/` | `server/handlers/` |
| `JobsFilter.js` | `server/` | `server/handlers/` |
| `Router.js` | `server/` | `server/` (stays — routing root) |
| `RouteRegister.js` | `server/` | `server/` (stays — routing root) |
| `PathValidator.js` | `server/` | `server/` (stays — routing root) |
| `RequestHandler.js` | `server/` | `server/` (stays — base class) |
| `WebServer.js` | `server/` | `server/` (stays — entrypoint) |

### Matching spec moves (`source/spec/lib/server/`)

| File | From | To |
|---|---|---|
| `EngineContinueRequestHandler_spec.js` | `spec/lib/server/` | `spec/lib/server/handlers/engine/` |
| `EnginePauseRequestHandler_spec.js` | `spec/lib/server/` | `spec/lib/server/handlers/engine/` |
| `EngineRestartRequestHandler_spec.js` | `spec/lib/server/` | `spec/lib/server/handlers/engine/` |
| `EngineShutdownRequestHandler_spec.js` | `spec/lib/server/` | `spec/lib/server/handlers/engine/` |
| `EngineStartRequestHandler_spec.js` | `spec/lib/server/` | `spec/lib/server/handlers/engine/` |
| `EngineStatusRequestHandler_spec.js` | `spec/lib/server/` | `spec/lib/server/handlers/engine/` |
| `EngineStopRequestHandler_spec.js` | `spec/lib/server/` | `spec/lib/server/handlers/engine/` |
| `JobLogsRequestHandler_spec.js` | `spec/lib/server/` | `spec/lib/server/handlers/jobs/` |
| `JobRequestHandler_spec.js` | `spec/lib/server/` | `spec/lib/server/handlers/jobs/` |
| `JobRetryRequestHandler_spec.js` | `spec/lib/server/` | `spec/lib/server/handlers/jobs/` |
| `JobsRequestHandler_spec.js` | `spec/lib/server/` | `spec/lib/server/handlers/jobs/` |
| `AssetsRequestHandler_spec.js` | `spec/lib/server/` | `spec/lib/server/handlers/` |
| `BaseUrlsRequestHandler_spec.js` | `spec/lib/server/` | `spec/lib/server/handlers/` |
| `IndexRequestHandler_spec.js` | `spec/lib/server/` | `spec/lib/server/handlers/` |
| `LogsRequestHandler_spec.js` | `spec/lib/server/` | `spec/lib/server/handlers/` |
| `SettingsRequestHandler_spec.js` | `spec/lib/server/` | `spec/lib/server/handlers/` |
| `StatsRequestHandler_spec.js` | `spec/lib/server/` | `spec/lib/server/handlers/` |
| `JobsFilter_spec.js` | `spec/lib/server/` | `spec/lib/server/handlers/` |

---

## Implementation Steps

### Step 1 — Reorganize `models/`
Move lib files and spec files per the tables in Part 1. Update all imports.

### Step 2 — Reorganize `exceptions/`
Move lib files and spec files per the tables in Part 2. Update all imports.

### Step 3 — Reorganize `server/`
Move lib files and spec files per the tables in Part 3. Update all imports.

### Step 4 — Update `docs/agents/architecture.md`
Update the `models/`, `exceptions/`, and `server/` sections to reflect the new subfolder layout.

### Step 5 — Verify
Run tests and linter after all three reorganizations.

## Files to Change
- All moved files under `source/lib/models/`, `source/lib/exceptions/`, `source/lib/server/`
- All moved spec files under `source/spec/lib/models/`, `source/spec/lib/exceptions/`, `source/spec/lib/server/`
- Any file across `source/` that imports a moved file — import paths updated
- `docs/agents/architecture.md` — structure sections updated

## CI Checks
Before opening a PR, run the following checks for the folders being modified:
- `source/`: `yarn test` (CircleCI job: `jasmine`)
- `source/`: `yarn lint` (CircleCI job: `checks`)

## Notes
- No logic changes — pure structural reorganization.
- `AppError.js` stays at `exceptions/` root since all other exceptions extend it.
- `Router.js`, `RouteRegister.js`, `PathValidator.js`, `RequestHandler.js`, and `WebServer.js` stay at `server/` root as routing infrastructure.
- Each part (models, exceptions, server) should be committed separately to keep commits atomic.
- Some exception classes have no spec file (e.g. `ClientNotFound`, `ForbiddenError`); no spec to move for those.

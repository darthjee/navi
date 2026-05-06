# Plan: Organize Files in the Application

## Overview
Reorganize three oversized flat folders in `source/lib/` — `models/`, `exceptions/`, and `server/` — into focused subfolders by responsibility. Move matching spec files to mirror the new layout, update all imports, and update `docs/agents/architecture.md` and `docs/agents/web-server.md`.

## Context
`source/lib/models/` (15 files), `source/lib/exceptions/` (18 files), and `source/lib/server/` (24 files) each mix files of different responsibilities at the same flat level. `source/lib/utils/` already follows the subfolder-per-concern pattern this issue aims to apply everywhere.

---

## Part 1 — `source/lib/models/`

### Lib file moves

| File | Destination |
|---|---|
| `Config.js` | `models/configs/` |
| `FailureConfig.js` | `models/configs/` |
| `LogConfig.js` | `models/configs/` |
| `PaginationConfig.js` | `models/configs/` |
| `WebConfig.js` | `models/configs/` |
| `WorkersConfig.js` | `models/configs/` |
| `AssetRequest.js` | `models/request/` |
| `Resource.js` | `models/request/` |
| `ResourceRequest.js` | `models/request/` |
| `ResourceRequestAction.js` | `models/request/` |
| `ResourceRequestPaginatedAction.js` | `models/request/` |
| `ParametersMapper.js` | `models/response/` |
| `PathResolver.js` | `models/response/` |
| `PathSegmentTraverser.js` | `models/response/` |
| `ResponseParser.js` | `models/response/` |
| `ResponseWrapper.js` | `models/response/` |

### Spec file moves

| File | Destination |
|---|---|
| `Config_fromFile_spec.js` | `spec/lib/models/configs/` |
| `Config_getClient_spec.js` | `spec/lib/models/configs/` |
| `Config_getResource_spec.js` | `spec/lib/models/configs/` |
| `FailureConfig_spec.js` | `spec/lib/models/configs/` |
| `LogConfig_spec.js` | `spec/lib/models/configs/` |
| `PaginationConfig_spec.js` | `spec/lib/models/configs/` |
| `WebConfig_spec.js` | `spec/lib/models/configs/` |
| `WorkersConfig_spec.js` | `spec/lib/models/configs/` |
| `AssetRequest_spec.js` | `spec/lib/models/request/` |
| `Resource_spec.js` | `spec/lib/models/request/` |
| `ResourceRequest_spec.js` | `spec/lib/models/request/` |
| `ResourceRequestAction_spec.js` | `spec/lib/models/request/` |
| `ResourceRequestPaginatedAction_spec.js` | `spec/lib/models/request/` |
| `ParametersMapper_spec.js` | `spec/lib/models/response/` |
| `PathResolver_spec.js` | `spec/lib/models/response/` |
| `PathSegmentTraverser_spec.js` | `spec/lib/models/response/` |
| `ResponseParser_spec.js` | `spec/lib/models/response/` |
| `ResponseWrapper_spec.js` | `spec/lib/models/response/` |

---

## Part 2 — `source/lib/exceptions/`

### Lib file moves

| File | Destination |
|---|---|
| `AppError.js` | `exceptions/` (stays — shared base class) |
| `ConflictError.js` | `exceptions/http/` |
| `ForbiddenError.js` | `exceptions/http/` |
| `NotFoundError.js` | `exceptions/http/` |
| `ConfigurationFileNotFound.js` | `exceptions/config/` |
| `ConfigurationFileNotProvided.js` | `exceptions/config/` |
| `MissingClientsConfig.js` | `exceptions/config/` |
| `MissingResourceConfig.js` | `exceptions/config/` |
| `MissingTopLevelConfgKey.js` | `exceptions/config/` |
| `InvalidHtmlResponseBody.js` | `exceptions/request/` |
| `InvalidResponseBody.js` | `exceptions/request/` |
| `NullResponse.js` | `exceptions/request/` |
| `RequestFailed.js` | `exceptions/request/` |
| `ClientNotFound.js` | `exceptions/registry/` |
| `ItemNotFound.js` | `exceptions/registry/` |
| `ResourceNotFound.js` | `exceptions/registry/` |
| `MissingActionResource.js` | `exceptions/registry/` |
| `MissingMappingVariable.js` | `exceptions/registry/` |

### Spec file moves

| File | Destination |
|---|---|
| `ConflictError_spec.js` | `spec/lib/exceptions/http/` |
| `NotFoundError_spec.js` | `spec/lib/exceptions/http/` |
| `InvalidHtmlResponseBody_spec.js` | `spec/lib/exceptions/request/` |
| `InvalidResponseBody_spec.js` | `spec/lib/exceptions/request/` |
| `NullResponse_spec.js` | `spec/lib/exceptions/request/` |
| `MissingActionResource_spec.js` | `spec/lib/exceptions/registry/` |
| `MissingMappingVariable_spec.js` | `spec/lib/exceptions/registry/` |

No spec files exist for: `AppError`, `ClientNotFound`, `ConfigurationFileNotFound`, `ConfigurationFileNotProvided`, `ForbiddenError`, `ItemNotFound`, `MissingClientsConfig`, `MissingResourceConfig`, `MissingTopLevelConfgKey`, `RequestFailed`, `ResourceNotFound` — nothing to move for these.

---

## Part 3 — `source/lib/server/`

### Lib file moves

| File | Destination |
|---|---|
| `WebServer.js` | `server/` (stays) |
| `Router.js` | `server/` (stays) |
| `RouteRegister.js` | `server/` (stays) |
| `PathValidator.js` | `server/` (stays) |
| `RequestHandler.js` | `server/` (stays — abstract base class) |
| `EngineContinueRequestHandler.js` | `server/handlers/engine/` |
| `EnginePauseRequestHandler.js` | `server/handlers/engine/` |
| `EngineRestartRequestHandler.js` | `server/handlers/engine/` |
| `EngineShutdownRequestHandler.js` | `server/handlers/engine/` |
| `EngineStartRequestHandler.js` | `server/handlers/engine/` |
| `EngineStatusRequestHandler.js` | `server/handlers/engine/` |
| `EngineStopRequestHandler.js` | `server/handlers/engine/` |
| `JobLogsRequestHandler.js` | `server/handlers/jobs/` |
| `JobRequestHandler.js` | `server/handlers/jobs/` |
| `JobRetryRequestHandler.js` | `server/handlers/jobs/` |
| `JobsRequestHandler.js` | `server/handlers/jobs/` |
| `AssetsRequestHandler.js` | `server/handlers/` |
| `BaseUrlsRequestHandler.js` | `server/handlers/` |
| `IndexRequestHandler.js` | `server/handlers/` |
| `LogsRequestHandler.js` | `server/handlers/` |
| `SettingsRequestHandler.js` | `server/handlers/` |
| `StatsRequestHandler.js` | `server/handlers/` |
| `JobsFilter.js` | `server/handlers/` |

### Spec file moves

| File | Destination |
|---|---|
| `WebServer_spec.js` | `spec/lib/server/` (stays) |
| `Router_spec.js` | `spec/lib/server/` (stays) |
| `RouteRegister_spec.js` | `spec/lib/server/` (stays) |
| `RouteRegister_patch_spec.js` | `spec/lib/server/` (stays) |
| `PathValidator_spec.js` | `spec/lib/server/` (stays) |
| `RequestHandler_spec.js` | `spec/lib/server/` (stays) |
| `EngineContinueRequestHandler_spec.js` | `spec/lib/server/handlers/engine/` |
| `EnginePauseRequestHandler_spec.js` | `spec/lib/server/handlers/engine/` |
| `EngineRestartRequestHandler_spec.js` | `spec/lib/server/handlers/engine/` |
| `EngineShutdownRequestHandler_spec.js` | `spec/lib/server/handlers/engine/` |
| `EngineStartRequestHandler_spec.js` | `spec/lib/server/handlers/engine/` |
| `EngineStatusRequestHandler_spec.js` | `spec/lib/server/handlers/engine/` |
| `EngineStopRequestHandler_spec.js` | `spec/lib/server/handlers/engine/` |
| `JobLogsRequestHandler_spec.js` | `spec/lib/server/handlers/jobs/` |
| `JobRequestHandler_spec.js` | `spec/lib/server/handlers/jobs/` |
| `JobRetryRequestHandler_spec.js` | `spec/lib/server/handlers/jobs/` |
| `JobsRequestHandler_spec.js` | `spec/lib/server/handlers/jobs/` |
| `AssetsRequestHandler_spec.js` | `spec/lib/server/handlers/` |
| `BaseUrlsRequestHandler_spec.js` | `spec/lib/server/handlers/` |
| `IndexRequestHandler_spec.js` | `spec/lib/server/handlers/` |
| `LogsRequestHandler_spec.js` | `spec/lib/server/handlers/` |
| `SettingsRequestHandler_spec.js` | `spec/lib/server/handlers/` |
| `StatsRequestHandler_spec.js` | `spec/lib/server/handlers/` |
| `JobsFilter_spec.js` | `spec/lib/server/handlers/` |

---

## Implementation Steps

### Step 1 — Reorganize `models/`
Move lib and spec files per the Part 1 tables. Update all imports across `source/`.

### Step 2 — Reorganize `exceptions/`
Move lib and spec files per the Part 2 tables. Update all imports across `source/`.

### Step 3 — Reorganize `server/`
Move lib and spec files per the Part 3 tables. Update all imports across `source/`.

### Step 4 — Update `docs/agents/architecture.md`
Update the `### exceptions/`, `### models/`, and spec layout sections to reflect the new subfolder structure.

### Step 5 — Update `docs/agents/web-server.md`
Update the "Source layout" section (which shows `source/lib/server/`) to reflect the new `handlers/engine/` and `handlers/jobs/` subfolders.

### Step 6 — Verify
Run tests and linter after all three reorganizations.

## CI Checks
Before opening a PR, run the following checks for the folders being modified:
- `source/`: `yarn test` (CircleCI job: `jasmine`)
- `source/`: `yarn lint` (CircleCI job: `checks`)

## Notes
- No logic changes — pure structural reorganization.
- `AppError.js` stays at `exceptions/` root since all other exceptions extend it.
- `Router.js`, `RouteRegister.js`, `PathValidator.js`, `RequestHandler.js`, and `WebServer.js` stay at `server/` root as routing infrastructure.
- Each part (models, exceptions, server) should be committed separately to keep commits atomic.
- Some exception classes have no spec file; nothing to move for those.

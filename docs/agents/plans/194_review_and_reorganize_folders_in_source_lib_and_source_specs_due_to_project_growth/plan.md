# Plan: Review and reorganize folders in source/lib and source/specs

## Overview

Move all 55 spec files from `source/spec/<category>/` into `source/spec/lib/<category>/` so that
the spec tree mirrors `source/lib/` and is clearly separated from `source/spec/support/`.
Update all import paths inside the moved files. No production code is changed.

## Folder analysis

The 7 existing subfolders all map cleanly to distinct concerns and are worth keeping:

| Folder | Count | Assessment |
|--------|-------|------------|
| `exceptions/` | 4 files | ✅ Clear concept, appropriate size |
| `factories/` | 3 files | ✅ Clear concept, appropriate size |
| `models/` | 12 files | ✅ Reflects domain model layer |
| `registry/` | 6 files | ✅ Reflects registry pattern |
| `server/` | 5 files | ✅ Groups web server components |
| `services/` | 7 files | ✅ Groups service layer |
| `utils/` | 18 files | ⚠️ Large — see note below |

**Note on `utils/`:** Of the 18 files, 8 belong to the logging subsystem (`BaseLogger`,
`BufferedLogger`, `ConsoleLogger`, `Log`, `LogBuffer`, `LogFactory`, `Logger`, `LoggerGroup`).
Splitting them into a `logging/` subfolder would reduce `utils/` to 10 files and make the
logging boundary explicit. However, this requires an equivalent split in `source/lib/utils/`,
which is out of scope for this issue. This is flagged as a natural follow-up.

**Conclusion:** No new folders are introduced in this issue. The existing 7 categories are kept
as-is under the new `spec/lib/` parent.

## Target structure

```
source/spec/
  lib/
    exceptions/   ← was source/spec/exceptions/
    factories/    ← was source/spec/factories/
    models/       ← was source/spec/models/
    registry/     ← was source/spec/registry/
    server/       ← was source/spec/server/
    services/     ← was source/spec/services/
    utils/        ← was source/spec/utils/
  support/        ← unchanged
```

## Import path changes

Each moved spec file gains one extra folder level (`lib/`), so all relative imports shift by one:

| Import target | Before | After |
|---------------|--------|-------|
| `source/lib/…` | `../../lib/…` | `../../../lib/…` |
| `source/spec/support/…` | `../support/…` | `../../support/…` |

## Complete file list

### `exceptions/` — 4 files

| From | To |
|------|----|
| `source/spec/exceptions/InvalidResponseBody_spec.js` | `source/spec/lib/exceptions/InvalidResponseBody_spec.js` |
| `source/spec/exceptions/MissingActionResource_spec.js` | `source/spec/lib/exceptions/MissingActionResource_spec.js` |
| `source/spec/exceptions/MissingMappingVariable_spec.js` | `source/spec/lib/exceptions/MissingMappingVariable_spec.js` |
| `source/spec/exceptions/NullResponse_spec.js` | `source/spec/lib/exceptions/NullResponse_spec.js` |

### `factories/` — 3 files

| From | To |
|------|----|
| `source/spec/factories/Factory_spec.js` | `source/spec/lib/factories/Factory_spec.js` |
| `source/spec/factories/JobFactory_spec.js` | `source/spec/lib/factories/JobFactory_spec.js` |
| `source/spec/factories/WorkerFactory_spec.js` | `source/spec/lib/factories/WorkerFactory_spec.js` |

### `models/` — 12 files

| From | To |
|------|----|
| `source/spec/models/ActionsExecutor_spec.js` | `source/spec/lib/models/ActionsExecutor_spec.js` |
| `source/spec/models/Config_spec.js` | `source/spec/lib/models/Config_spec.js` |
| `source/spec/models/Job_spec.js` | `source/spec/lib/models/Job_spec.js` |
| `source/spec/models/Resource_spec.js` | `source/spec/lib/models/Resource_spec.js` |
| `source/spec/models/ResourceRequest_spec.js` | `source/spec/lib/models/ResourceRequest_spec.js` |
| `source/spec/models/ResourceRequestAction_spec.js` | `source/spec/lib/models/ResourceRequestAction_spec.js` |
| `source/spec/models/ResourceRequestJob_spec.js` | `source/spec/lib/models/ResourceRequestJob_spec.js` |
| `source/spec/models/ResponseParser_spec.js` | `source/spec/lib/models/ResponseParser_spec.js` |
| `source/spec/models/VariablesMapper_spec.js` | `source/spec/lib/models/VariablesMapper_spec.js` |
| `source/spec/models/VariablesMapper_spec.js` | `source/spec/lib/models/VariablesMapper_spec.js` |
| `source/spec/models/WebConfig_spec.js` | `source/spec/lib/models/WebConfig_spec.js` |
| `source/spec/models/Worker_spec.js` | `source/spec/lib/models/Worker_spec.js` |
| `source/spec/models/WorkersConfig_spec.js` | `source/spec/lib/models/WorkersConfig_spec.js` |

### `registry/` — 6 files

| From | To |
|------|----|
| `source/spec/registry/ClientRegistry_spec.js` | `source/spec/lib/registry/ClientRegistry_spec.js` |
| `source/spec/registry/JobRegistry_spec.js` | `source/spec/lib/registry/JobRegistry_spec.js` |
| `source/spec/registry/JobRegistry_stats_spec.js` | `source/spec/lib/registry/JobRegistry_stats_spec.js` |
| `source/spec/registry/NamedRegistry_spec.js` | `source/spec/lib/registry/NamedRegistry_spec.js` |
| `source/spec/registry/ResourceRegistry_spec.js` | `source/spec/lib/registry/ResourceRegistry_spec.js` |
| `source/spec/registry/WorkersRegistry_spec.js` | `source/spec/lib/registry/WorkersRegistry_spec.js` |

### `server/` — 5 files

| From | To |
|------|----|
| `source/spec/server/RequestHandler_spec.js` | `source/spec/lib/server/RequestHandler_spec.js` |
| `source/spec/server/RouteRegister_spec.js` | `source/spec/lib/server/RouteRegister_spec.js` |
| `source/spec/server/Router_spec.js` | `source/spec/lib/server/Router_spec.js` |
| `source/spec/server/StatsRequestHandler_spec.js` | `source/spec/lib/server/StatsRequestHandler_spec.js` |
| `source/spec/server/WebServer_spec.js` | `source/spec/lib/server/WebServer_spec.js` |

### `services/` — 7 files

| From | To |
|------|----|
| `source/spec/services/Application_spec.js` | `source/spec/lib/services/Application_spec.js` |
| `source/spec/services/ArgumentsParser_spec.js` | `source/spec/lib/services/ArgumentsParser_spec.js` |
| `source/spec/services/Client_spec.js` | `source/spec/lib/services/Client_spec.js` |
| `source/spec/services/ConfigLoader_spec.js` | `source/spec/lib/services/ConfigLoader_spec.js` |
| `source/spec/services/ConfigParser_spec.js` | `source/spec/lib/services/ConfigParser_spec.js` |
| `source/spec/services/Engine_spec.js` | `source/spec/lib/services/Engine_spec.js` |
| `source/spec/services/WorkersAllocator_spec.js` | `source/spec/lib/services/WorkersAllocator_spec.js` |

### `utils/` — 18 files

| From | To |
|------|----|
| `source/spec/utils/BaseLogger_spec.js` | `source/spec/lib/utils/BaseLogger_spec.js` |
| `source/spec/utils/BufferedLogger_spec.js` | `source/spec/lib/utils/BufferedLogger_spec.js` |
| `source/spec/utils/Collection_spec.js` | `source/spec/lib/utils/Collection_spec.js` |
| `source/spec/utils/ConsoleLogger_spec.js` | `source/spec/lib/utils/ConsoleLogger_spec.js` |
| `source/spec/utils/IdentifyableCollection_spec.js` | `source/spec/lib/utils/IdentifyableCollection_spec.js` |
| `source/spec/utils/IdGenerator_spec.js` | `source/spec/lib/utils/IdGenerator_spec.js` |
| `source/spec/utils/IncrementalIdGenerator_spec.js` | `source/spec/lib/utils/IncrementalIdGenerator_spec.js` |
| `source/spec/utils/Log_spec.js` | `source/spec/lib/utils/Log_spec.js` |
| `source/spec/utils/LogBuffer_spec.js` | `source/spec/lib/utils/LogBuffer_spec.js` |
| `source/spec/utils/LogFactory_spec.js` | `source/spec/lib/utils/LogFactory_spec.js` |
| `source/spec/utils/Logger_spec.js` | `source/spec/lib/utils/Logger_spec.js` |
| `source/spec/utils/LoggerGroup_spec.js` | `source/spec/lib/utils/LoggerGroup_spec.js` |
| `source/spec/utils/Queue_spec.js` | `source/spec/lib/utils/Queue_spec.js` |
| `source/spec/utils/ResourceRequestCollector_spec.js` | `source/spec/lib/utils/ResourceRequestCollector_spec.js` |
| `source/spec/utils/SortedArrayMerger_spec.js` | `source/spec/lib/utils/SortedArrayMerger_spec.js` |
| `source/spec/utils/SortedArraySearcher_spec.js` | `source/spec/lib/utils/SortedArraySearcher_spec.js` |
| `source/spec/utils/SortedCollection_spec.js` | `source/spec/lib/utils/SortedCollection_spec.js` |
| `source/spec/utils/UUidGenerator_spec.js` | `source/spec/lib/utils/UUidGenerator_spec.js` |

## Implementation Steps

### Step 1 — Move the files

Create `source/spec/lib/` and all 7 subfolders. Move each file according to the table above.

### Step 2 — Update import paths in every moved file

For each moved file, update every relative import:
- `../../lib/` → `../../../lib/`
- `../support/` → `../../support/`

### Step 3 — Verify jasmine configuration

The `package.json` jasmine config uses `spec_dir: "spec"` with `spec_files: ["**/*[sS]pec.js"]`,
which is recursive and will discover files under `spec/lib/` without changes.
The npm scripts (`npx jasmine spec/**/*.js`) also cover the new location.

### Step 4 — Run lint and tests

Run `yarn lint` and `yarn test` inside the container to verify no regressions.

## CI Checks

Before opening a PR, run inside the `navi_app` container:
- `cd source; yarn lint` (CircleCI job: `checks`)
- `cd source; yarn test` (CircleCI job: `jasmine`)

## Notes

- No production code (`source/lib/`) is changed.
- `source/spec/support/` stays exactly where it is.
- This is a pure move — no logic changes.
- **Follow-up:** Split `source/lib/utils/` and `source/spec/lib/utils/` into
  `utils/` + `utils/logging/` to reduce the 18-file flat list into two smaller, coherent groups.

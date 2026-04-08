# Plan: Review and reorganize folders in source/lib and source/specs

## Overview

Two changes in one PR:

1. Move all spec files from `source/spec/<category>/` into `source/spec/lib/<category>/` so the
   spec tree mirrors `source/lib/` and is clearly separated from `source/spec/support/`.
2. Split `source/lib/utils/` (and the matching `source/spec/lib/utils/`) into three focused
   subfolders: `logging/`, `collections/`, `generators/`.

Update all import paths wherever they are affected. No production logic changes.

---

## Target structure

### `source/lib/utils/`

```
utils/
  logging/      ← BaseLogger, BufferedLogger, ConsoleLogger, Log,
                ←   LogBuffer, LogFactory, Logger, LoggerGroup (8 files)
  collections/  ← Collection, IdentifyableCollection, Queue,
                ←   SortedArrayMerger, SortedArraySearcher, SortedCollection (6 files)
  generators/   ← IdGenerator, IncrementalIdGenerator, UUidGenerator (3 files)
  index.js      ← re-exports Logger and LoggerGroup (updated paths)
  ResourceRequestCollector.js  ← stays flat (domain utility, 1 file)
```

### `source/spec/`

```
spec/
  lib/
    exceptions/
    factories/
    models/
    registry/
    server/
    services/
    utils/
      logging/      ← 8 spec files
      collections/  ← 6 spec files
      generators/   ← 3 spec files
      ResourceRequestCollector_spec.js  ← stays flat
  support/          ← unchanged
```

---

## Import path reference

### Spec files in `spec/lib/<category>/` (not utils)

| Import target | New path |
|---------------|----------|
| `source/lib/…` | `../../../lib/…` |
| `source/spec/support/…` | `../../support/…` |

### Spec files in `spec/lib/utils/` (flat, i.e. `ResourceRequestCollector_spec.js`)

| Import target | New path |
|---------------|----------|
| `source/lib/utils/…` | `../../../lib/utils/…` |
| `source/spec/support/…` | `../../support/…` |

### Spec files in `spec/lib/utils/logging/`, `collections/`, or `generators/`

| Import target | New path |
|---------------|----------|
| `source/lib/utils/logging/…` | `../../../../lib/utils/logging/…` |
| `source/lib/utils/collections/…` | `../../../../lib/utils/collections/…` |
| `source/lib/utils/generators/…` | `../../../../lib/utils/generators/…` |
| `source/spec/support/…` | `../../../support/…` |

---

## Complete file list

### Part 1 — `source/lib/utils/` reorganization

#### Files moving to `source/lib/utils/logging/`

| From | To |
|------|----|
| `source/lib/utils/BaseLogger.js` | `source/lib/utils/logging/BaseLogger.js` |
| `source/lib/utils/BufferedLogger.js` | `source/lib/utils/logging/BufferedLogger.js` |
| `source/lib/utils/ConsoleLogger.js` | `source/lib/utils/logging/ConsoleLogger.js` |
| `source/lib/utils/Log.js` | `source/lib/utils/logging/Log.js` |
| `source/lib/utils/LogBuffer.js` | `source/lib/utils/logging/LogBuffer.js` |
| `source/lib/utils/LogFactory.js` | `source/lib/utils/logging/LogFactory.js` |
| `source/lib/utils/Logger.js` | `source/lib/utils/logging/Logger.js` |
| `source/lib/utils/LoggerGroup.js` | `source/lib/utils/logging/LoggerGroup.js` |

#### Files moving to `source/lib/utils/collections/`

| From | To |
|------|----|
| `source/lib/utils/Collection.js` | `source/lib/utils/collections/Collection.js` |
| `source/lib/utils/IdentifyableCollection.js` | `source/lib/utils/collections/IdentifyableCollection.js` |
| `source/lib/utils/Queue.js` | `source/lib/utils/collections/Queue.js` |
| `source/lib/utils/SortedArrayMerger.js` | `source/lib/utils/collections/SortedArrayMerger.js` |
| `source/lib/utils/SortedArraySearcher.js` | `source/lib/utils/collections/SortedArraySearcher.js` |
| `source/lib/utils/SortedCollection.js` | `source/lib/utils/collections/SortedCollection.js` |

#### Files moving to `source/lib/utils/generators/`

| From | To |
|------|----|
| `source/lib/utils/IdGenerator.js` | `source/lib/utils/generators/IdGenerator.js` |
| `source/lib/utils/IncrementalIdGenerator.js` | `source/lib/utils/generators/IncrementalIdGenerator.js` |
| `source/lib/utils/UUidGenerator.js` | `source/lib/utils/generators/UUidGenerator.js` |

#### Staying flat in `source/lib/utils/`

| File | Reason |
|------|--------|
| `source/lib/utils/ResourceRequestCollector.js` | Domain utility, doesn't fit the other groups |
| `source/lib/utils/index.js` | Re-export index — updated to new paths |

---

### Part 2 — `source/lib/` imports to update

| File | Old import | New import |
|------|-----------|-----------|
| `source/lib/utils/index.js` | `./Logger.js` | `./logging/Logger.js` |
| `source/lib/utils/index.js` | `./LoggerGroup.js` | `./logging/LoggerGroup.js` |
| `source/lib/factories/JobFactory.js` | `../utils/IdGenerator.js` | `../utils/generators/IdGenerator.js` |
| `source/lib/factories/WorkerFactory.js` | `../utils/IdGenerator.js` | `../utils/generators/IdGenerator.js` |
| `source/lib/models/ActionsExecutor.js` | `../utils/Logger.js` | `../utils/logging/Logger.js` |
| `source/lib/models/ResourceRequestAction.js` | `../utils/Logger.js` | `../utils/logging/Logger.js` |
| `source/lib/models/ResourceRequestJob.js` | `../utils/Logger.js` | `../utils/logging/Logger.js` |
| `source/lib/models/Worker.js` | `../utils/ConsoleLogger.js` | `../utils/logging/ConsoleLogger.js` |
| `source/lib/registry/JobRegistry.js` | `../utils/IdentifyableCollection.js` | `../utils/collections/IdentifyableCollection.js` |
| `source/lib/registry/JobRegistry.js` | `../utils/Queue.js` | `../utils/collections/Queue.js` |
| `source/lib/registry/JobRegistry.js` | `../utils/SortedCollection.js` | `../utils/collections/SortedCollection.js` |
| `source/lib/registry/WorkersRegistry.js` | `../utils/IdentifyableCollection.js` | `../utils/collections/IdentifyableCollection.js` |
| `source/lib/services/Client.js` | `../utils/Logger.js` | `../utils/logging/Logger.js` |
| `source/lib/services/ConfigLoader.js` | `../utils/Logger.js` | `../utils/logging/Logger.js` |

---

### Part 3 — Spec files: move to `spec/lib/` and update imports

#### `exceptions/` — 4 files

| From | To |
|------|----|
| `source/spec/exceptions/InvalidResponseBody_spec.js` | `source/spec/lib/exceptions/InvalidResponseBody_spec.js` |
| `source/spec/exceptions/MissingActionResource_spec.js` | `source/spec/lib/exceptions/MissingActionResource_spec.js` |
| `source/spec/exceptions/MissingMappingVariable_spec.js` | `source/spec/lib/exceptions/MissingMappingVariable_spec.js` |
| `source/spec/exceptions/NullResponse_spec.js` | `source/spec/lib/exceptions/NullResponse_spec.js` |

#### `factories/` — 3 files

| From | To |
|------|----|
| `source/spec/factories/Factory_spec.js` | `source/spec/lib/factories/Factory_spec.js` |
| `source/spec/factories/JobFactory_spec.js` | `source/spec/lib/factories/JobFactory_spec.js` |
| `source/spec/factories/WorkerFactory_spec.js` | `source/spec/lib/factories/WorkerFactory_spec.js` |

#### `models/` — 12 files

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
| `source/spec/models/WebConfig_spec.js` | `source/spec/lib/models/WebConfig_spec.js` |
| `source/spec/models/Worker_spec.js` | `source/spec/lib/models/Worker_spec.js` |
| `source/spec/models/WorkersConfig_spec.js` | `source/spec/lib/models/WorkersConfig_spec.js` |

#### `registry/` — 6 files

| From | To |
|------|----|
| `source/spec/registry/ClientRegistry_spec.js` | `source/spec/lib/registry/ClientRegistry_spec.js` |
| `source/spec/registry/JobRegistry_spec.js` | `source/spec/lib/registry/JobRegistry_spec.js` |
| `source/spec/registry/JobRegistry_stats_spec.js` | `source/spec/lib/registry/JobRegistry_stats_spec.js` |
| `source/spec/registry/NamedRegistry_spec.js` | `source/spec/lib/registry/NamedRegistry_spec.js` |
| `source/spec/registry/ResourceRegistry_spec.js` | `source/spec/lib/registry/ResourceRegistry_spec.js` |
| `source/spec/registry/WorkersRegistry_spec.js` | `source/spec/lib/registry/WorkersRegistry_spec.js` |

#### `server/` — 5 files

| From | To |
|------|----|
| `source/spec/server/RequestHandler_spec.js` | `source/spec/lib/server/RequestHandler_spec.js` |
| `source/spec/server/RouteRegister_spec.js` | `source/spec/lib/server/RouteRegister_spec.js` |
| `source/spec/server/Router_spec.js` | `source/spec/lib/server/Router_spec.js` |
| `source/spec/server/StatsRequestHandler_spec.js` | `source/spec/lib/server/StatsRequestHandler_spec.js` |
| `source/spec/server/WebServer_spec.js` | `source/spec/lib/server/WebServer_spec.js` |

#### `services/` — 7 files

| From | To |
|------|----|
| `source/spec/services/Application_spec.js` | `source/spec/lib/services/Application_spec.js` |
| `source/spec/services/ArgumentsParser_spec.js` | `source/spec/lib/services/ArgumentsParser_spec.js` |
| `source/spec/services/Client_spec.js` | `source/spec/lib/services/Client_spec.js` |
| `source/spec/services/ConfigLoader_spec.js` | `source/spec/lib/services/ConfigLoader_spec.js` |
| `source/spec/services/ConfigParser_spec.js` | `source/spec/lib/services/ConfigParser_spec.js` |
| `source/spec/services/Engine_spec.js` | `source/spec/lib/services/Engine_spec.js` |
| `source/spec/services/WorkersAllocator_spec.js` | `source/spec/lib/services/WorkersAllocator_spec.js` |

#### `utils/logging/` — 8 files

| From | To |
|------|----|
| `source/spec/utils/BaseLogger_spec.js` | `source/spec/lib/utils/logging/BaseLogger_spec.js` |
| `source/spec/utils/BufferedLogger_spec.js` | `source/spec/lib/utils/logging/BufferedLogger_spec.js` |
| `source/spec/utils/ConsoleLogger_spec.js` | `source/spec/lib/utils/logging/ConsoleLogger_spec.js` |
| `source/spec/utils/Log_spec.js` | `source/spec/lib/utils/logging/Log_spec.js` |
| `source/spec/utils/LogBuffer_spec.js` | `source/spec/lib/utils/logging/LogBuffer_spec.js` |
| `source/spec/utils/LogFactory_spec.js` | `source/spec/lib/utils/logging/LogFactory_spec.js` |
| `source/spec/utils/Logger_spec.js` | `source/spec/lib/utils/logging/Logger_spec.js` |
| `source/spec/utils/LoggerGroup_spec.js` | `source/spec/lib/utils/logging/LoggerGroup_spec.js` |

#### `utils/collections/` — 6 files

| From | To |
|------|----|
| `source/spec/utils/Collection_spec.js` | `source/spec/lib/utils/collections/Collection_spec.js` |
| `source/spec/utils/IdentifyableCollection_spec.js` | `source/spec/lib/utils/collections/IdentifyableCollection_spec.js` |
| `source/spec/utils/Queue_spec.js` | `source/spec/lib/utils/collections/Queue_spec.js` |
| `source/spec/utils/SortedArrayMerger_spec.js` | `source/spec/lib/utils/collections/SortedArrayMerger_spec.js` |
| `source/spec/utils/SortedArraySearcher_spec.js` | `source/spec/lib/utils/collections/SortedArraySearcher_spec.js` |
| `source/spec/utils/SortedCollection_spec.js` | `source/spec/lib/utils/collections/SortedCollection_spec.js` |

#### `utils/generators/` — 3 files

| From | To |
|------|----|
| `source/spec/utils/IdGenerator_spec.js` | `source/spec/lib/utils/generators/IdGenerator_spec.js` |
| `source/spec/utils/IncrementalIdGenerator_spec.js` | `source/spec/lib/utils/generators/IncrementalIdGenerator_spec.js` |
| `source/spec/utils/UUidGenerator_spec.js` | `source/spec/lib/utils/generators/UUidGenerator_spec.js` |

#### `utils/` (flat) — 1 file

| From | To |
|------|----|
| `source/spec/utils/ResourceRequestCollector_spec.js` | `source/spec/lib/utils/ResourceRequestCollector_spec.js` |

---

## Implementation Steps

### Step 1 — Reorganize `source/lib/utils/`

Create subfolders `logging/`, `collections/`, `generators/` inside `source/lib/utils/`.
Move the 17 files listed above. Update internal imports within moved files (e.g.
`LogFactory.js` imports `Log.js` — both move to `logging/`, so the relative path stays `./Log.js`).

### Step 2 — Update `source/lib/utils/index.js`

Update the two re-export paths:
- `./Logger.js` → `./logging/Logger.js`
- `./LoggerGroup.js` → `./logging/LoggerGroup.js`

### Step 3 — Update imports in `source/lib/`

Update the 14 import paths listed in Part 2 across 9 lib files.

### Step 4 — Move spec files and update their imports

Create `source/spec/lib/` with all subfolders. Move all 55 spec files. Update imports in each
file using the path reference table above.

### Step 5 — Run lint and tests

Run `yarn lint` and `yarn test` inside the container to verify no regressions.

---

## CI Checks

Before opening a PR, run inside the `navi_app` container:
- `cd source; yarn lint` (CircleCI job: `checks`)
- `cd source; yarn test` (CircleCI job: `jasmine`)

## Notes

- Jasmine config (`spec_dir: "spec"`, `spec_files: ["**/*[sS]pec.js"]`) is recursive — no change needed.
- `source/spec/support/` is untouched.
- `ResourceRequestCollector` stays flat in `utils/` — its domain nature may warrant a move to `services/` in a future issue.

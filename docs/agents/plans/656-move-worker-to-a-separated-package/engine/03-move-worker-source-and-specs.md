# Move worker source and specs into worker/

`git mv` every file below from `source/` into its new home under `worker/`, then fix the handful of internal imports whose relative paths change shape. Populate `worker/lib/index.js` with the public re-exports once the files land.

## Source files moved

| From | To |
| --- | --- |
| source/lib/background/Worker.js | worker/lib/background/Worker.js |
| source/lib/background/WorkerFactory.js | worker/lib/background/WorkerFactory.js |
| source/lib/background/WorkersRegistry.js | worker/lib/background/WorkersRegistry.js |
| source/lib/background/WorkersRegistryInstance.js | worker/lib/background/WorkersRegistryInstance.js |
| source/lib/background/Job.js | worker/lib/background/Job.js |
| source/lib/background/JobFactory.js | worker/lib/background/JobFactory.js |
| source/lib/background/JobRegistry.js | worker/lib/background/JobRegistry.js |
| source/lib/background/JobRegistryInstance.js | worker/lib/background/JobRegistryInstance.js |
| source/lib/services/Engine.js | worker/lib/services/Engine.js |
| source/lib/services/WorkersAllocator.js | worker/lib/services/WorkersAllocator.js |
| source/lib/factory/Factory.js | worker/lib/Factory.js |
| source/lib/utils/collections/Collection.js | worker/lib/collections/Collection.js |
| source/lib/utils/collections/IdentifyableCollection.js | worker/lib/collections/IdentifyableCollection.js |
| source/lib/utils/collections/Queue.js | worker/lib/collections/Queue.js |
| source/lib/utils/collections/SortedCollection.js | worker/lib/collections/SortedCollection.js |
| source/lib/utils/collections/SortedArrayMerger.js | worker/lib/collections/SortedArrayMerger.js |
| source/lib/utils/collections/SortedArraySearcher.js | worker/lib/collections/SortedArraySearcher.js |
| source/lib/utils/generators/IdGenerator.js | worker/lib/generators/IdGenerator.js |
| source/lib/utils/generators/UUidGenerator.js | worker/lib/generators/UUidGenerator.js |

`UUidGenerator.js` moves too, even though it wasn't in the issue's first draft: `IdGenerator.js` delegates to it internally (`new UUidGenerator()` default), and nothing else in Navi imports it directly (`IncrementalIdGenerator.js` is the one used elsewhere — see below), so leaving it behind would break `IdGenerator.js`'s import after the move.

## Spec files moved

| From | To |
| --- | --- |
| source/spec/lib/background/*_spec.js (5 files) | worker/spec/background/*_spec.js |
| source/spec/lib/services/Engine_spec.js | worker/spec/services/Engine_spec.js |
| source/spec/lib/services/Engine_async_spec.js | worker/spec/services/Engine_async_spec.js |
| source/spec/lib/services/WorkersAllocator_spec.js | worker/spec/services/WorkersAllocator_spec.js |
| source/spec/lib/factory/Factory_spec.js | worker/spec/Factory_spec.js |
| source/spec/lib/utils/collections/*_spec.js (15 files) | worker/spec/collections/*_spec.js |
| source/spec/lib/utils/generators/IdGenerator_spec.js | worker/spec/generators/IdGenerator_spec.js |
| source/spec/lib/utils/generators/UUidGenerator_spec.js | worker/spec/generators/UUidGenerator_spec.js |

## Import adjustments inside worker/

- `WorkerFactory.js`: `import { Factory } from '../factory/Factory.js'` → `import { Factory } from '../Factory.js'`
- `JobRegistryInstance.js`: `import { IdentifyableCollection } from '../utils/collections/...'` → `import { IdentifyableCollection } from '../collections/...'`
- `Worker.js`: `LogContext` import already removed in step 01 — no change needed here beyond the file's new location.
- `Engine.js`/`WorkersAllocator.js`: static `JobRegistry`/`WorkersRegistry` imports already removed in step 01.

## What stays in Navi (verified during discussion, not moved)

| File | Reason |
| --- | --- |
| source/lib/jobs/*.js (5 subclasses) | Navi domain implementations — import `Job` from `deku-swarm` in step 04 |
| source/lib/utils/ResourceEnqueuer.js | Navi-specific |
| source/lib/utils/HtmlParser.js, HtmlElementParser.js | Navi-specific |
| source/lib/utils/logging/LogContext.js | Stays in Navi — `Worker` receives it via injected factory (step 01) |
| source/lib/utils/generators/IncrementalIdGenerator.js | Verified: used by `source/lib/common/utils/logging/LogFactory.js`, outside the worker subsystem |
| source/lib/services/EngineEvents.js, EngineStopService.js, FailureChecker.js, RunSummary.js | Injectable listeners — stay in Navi |
| source/lib/services/ApplicationInstance.js | Orchestrates boot, registers factories, imports from `deku-swarm` in step 04 |

`source/lib/utils/index.js` was checked: it currently re-exports only `Logger`/`LoggerGroup`, not any of the moved collections, so it needs no change.

## Files to Change

- All 19 source files and 27 spec files listed in the tables above — moved via `git mv`, with the two internal import path fixes.
- `worker/lib/index.js` — populate with:
  ```js
  export { Worker } from './background/Worker.js';
  export { WorkerFactory } from './background/WorkerFactory.js';
  export { WorkersRegistry } from './background/WorkersRegistry.js';
  export { Job } from './background/Job.js';
  export { JobFactory } from './background/JobFactory.js';
  export { JobRegistry } from './background/JobRegistry.js';
  export { Engine } from './services/Engine.js';
  export { WorkersAllocator } from './services/WorkersAllocator.js';
  export { IdentifyableCollection } from './collections/IdentifyableCollection.js';
  export { Queue } from './collections/Queue.js';
  export { SortedCollection } from './collections/SortedCollection.js';
  ```

# Make Navi consume deku-swarm

Wire `source/` up to depend on the new `worker/` package as a local `file:` dependency, and repoint every import that used to reach into `../background/`/`../services/` at `deku-swarm` instead.

`source/package.json`:

```json
"dependencies": {
  "deku-swarm": "file:../worker"
}
```

This resolves locally in dev (Docker mount, added by `docker` in a parallel step) and in CI (git checkout has both directories) without needing the package on npm yet. Before npm publish of Navi, a CI step (added by `architect`) swaps this to `^1.6.2`.

```js
// Before:
import { Job } from '../background/Job.js';
import { JobFactory } from '../background/JobFactory.js';
import { JobRegistry } from '../background/JobRegistry.js';
import { WorkersRegistry } from '../background/WorkersRegistry.js';
import { Engine } from '../services/Engine.js';
import { WorkersAllocator } from '../services/WorkersAllocator.js';

// After:
import { Job, JobFactory, JobRegistry, WorkersRegistry, Engine, WorkersAllocator } from 'deku-swarm';
```

## Files to Change

- `source/package.json` — add the `deku-swarm` dependency.
- `source/lib/jobs/ResourceRequestJob.js`, `ActionProcessingJob.js`, `PaginatedActionProcessingJob.js`, `HtmlParseJob.js`, `AssetDownloadJob.js` — import `Job` from `deku-swarm`.
- `source/lib/services/ApplicationInstance.js` — import `JobFactory`, `WorkersRegistry`, `Engine`, `WorkersAllocator` from `deku-swarm`; build the `loggerFactory` (from step 01) and pass injected registries into `Engine`/`WorkersAllocator`.
- `source/lib/enqueuers/ActionEnqueuer.js`, `PaginatedActionEnqueuer.js`, `source/lib/utils/ResourceEnqueuer.js` — import `JobRegistry` from `deku-swarm`.
- `source/lib/server/handlers/engine/*.js` — import whichever of `Engine`/`JobRegistry`/`WorkersRegistry` each handler uses from `deku-swarm`.
- `source/lib/serializers/*.js` — same, for any serializer touching worker/job shapes.
- Remaining specs under `source/spec/` that import the moved classes — repoint to `deku-swarm`.
- `node_modules`/lockfile — run `yarn install` inside `source/` so the new `file:../worker` dependency is linked.

## Notes

- No behavior change: this step is a pure import/wiring change on top of the already-refactored (step 01) and already-moved (step 03) code.
- `yarn install` in `source/` requires `worker/` (step 02/03) to already exist with a valid `package.json` — this step cannot land before those.

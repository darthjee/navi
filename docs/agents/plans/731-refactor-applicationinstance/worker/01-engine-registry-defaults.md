# Engine constructor registry defaults

Make `jobRegistry` / `workersRegistry` optional in the `Engine` constructor,
defaulting to the singleton facade classes.

- Add imports to `worker/lib/services/Engine.js`:
  `import { JobRegistry } from '../background/JobRegistry.js';`
  `import { WorkersRegistry } from '../background/WorkersRegistry.js';`
- In the constructor destructuring, change
  `{ allocator, jobRegistry, workersRegistry, sleepMs = 500, ... }`
  to
  `{ allocator, jobRegistry = JobRegistry, workersRegistry = WorkersRegistry, sleepMs = 500, ... }`.
- Destructuring defaults fire only on `undefined`, so any injected value (a facade
  class or a plain instance) still wins. Do not add extra `??` handling — and do
  not accommodate `null` (unsupported; documented).
- The existing `this.allocator = allocator || new WorkersAllocator({ jobRegistry, workersRegistry })`
  line is unchanged — it now always receives defined registries.
- Update the constructor JSDoc: `jobRegistry` / `workersRegistry` go from
  "The job registry..." (implicitly required) to optional, e.g.
  `@param {JobRegistry} [param0.jobRegistry=JobRegistry] - Defaults to the JobRegistry singleton facade. Pass an instance for explicit DI.` — same for `workersRegistry`.
- No `EngineFactory`, no static `Engine.build`.

## Files to Change

- `worker/lib/services/Engine.js` — imports, constructor defaults, JSDoc.

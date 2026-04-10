Navi Project

Implementation Plan: Refactor JobRegistry to Singleton Pattern with Static Delegation

A complete removal of JobRegistry dependency injection across the entire codebase.

10 de abril de 2026

---

### 1. Current Context

`JobRegistry` is currently instantiated once in `Application.#initRegistries` and threaded through
virtually every layer of the system as a constructor argument:

```
Application
  ├─ jobRegistry = new JobRegistry({ cooldown })
  ├─ Engine({ jobRegistry })
  │   └─ WorkersAllocator({ jobRegistry })
  ├─ WebServer({ jobRegistry })
  │   └─ Router({ jobRegistry })
  │       └─ StatsRequestHandler({ jobRegistry })
  ├─ WorkersRegistry({ jobRegistry })
  │   └─ WorkerFactory({ jobRegistry })
  │       └─ Worker({ jobRegistry })
  └─ enqueueFirstJobs → this.jobRegistry.enqueue(...)
       └─ ResourceRequestJob({ jobRegistry })
           └─ resourceRequest.enqueueActions(data, jobRegistry)
               └─ ActionsEnqueuer(actions, parsed, jobRegistry)
                   └─ ActionEnqueuer(action, items, jobRegistry)
```

### 2. The Problem

Every component above carries `jobRegistry` solely to forward it to the next layer or to call
methods on a globally shared object. This creates unnecessary coupling without real benefit.

The solution is to make `JobRegistry` a self-managing singleton accessible via static methods,
eliminating all constructor threading.

### 3. Implementation Plan

The refactoring is executed in 12 steps, working from the inside out.

#### Step 1 — Refactor `JobRegistry.js`

**File:** `source/lib/registry/JobRegistry.js`

- Rename the existing `JobRegistry` class to `JobRegistryInstance` (not exported).
- Create a new `JobRegistry` class as a static-only wrapper.
- Remove `lock()` and `hasLock()` from `JobRegistryInstance` — they have no production callers.
- Export only `JobRegistry`.

```javascript
import { JobFactory } from '../factories/JobFactory.js';
import { IdentifyableCollection } from '../utils/collections/IdentifyableCollection.js';
import { Queue } from '../utils/collections/Queue.js';
import { SortedCollection } from '../utils/collections/SortedCollection.js';

const FAILED_SORT_BY = job => job.readyBy;

class JobRegistryInstance {
  #enqueued;
  #failed;
  #retryQueue;
  #finished;
  #dead;
  #processing;
  #cooldown;

  constructor({ queue, failed, retryQueue, finished, dead, processing, cooldown = 5000 } = {}) {
    this.#enqueued   = queue      || new Queue();
    this.#failed     = failed     || new SortedCollection([], { sortBy: FAILED_SORT_BY });
    this.#retryQueue = retryQueue || new Queue();
    this.#finished   = finished   || new IdentifyableCollection();
    this.#dead       = dead       || new IdentifyableCollection();
    this.#processing = processing || new IdentifyableCollection();
    this.#cooldown   = cooldown;
  }

  enqueue(factoryKey, params = {}) { ... }   // unchanged
  fail(job)            { ... }                // unchanged
  finish(job)          { ... }                // unchanged
  pick()               { ... }                // unchanged
  promoteReadyJobs()   { ... }                // unchanged
  hasJob()             { ... }                // unchanged
  hasReadyJob()        { ... }                // unchanged
  stats()              { ... }                // unchanged
  // lock() and hasLock() REMOVED
}

class JobRegistry {
  static #instance = null;

  static build(options = {}) {
    if (JobRegistry.#instance) {
      throw new Error('JobRegistry.build() has already been called. Call reset() first.');
    }
    JobRegistry.#instance = new JobRegistryInstance(options);
    return JobRegistry.#instance;
  }

  static #getInstance() {
    if (!JobRegistry.#instance) {
      throw new Error('JobRegistry has not been built. Call JobRegistry.build() first.');
    }
    return JobRegistry.#instance;
  }

  static reset() {
    JobRegistry.#instance = null;
  }

  static enqueue(factoryKey, params = {}) { return JobRegistry.#getInstance().enqueue(factoryKey, params); }
  static fail(job)                        { return JobRegistry.#getInstance().fail(job); }
  static finish(job)                      { return JobRegistry.#getInstance().finish(job); }
  static pick()                           { return JobRegistry.#getInstance().pick(); }
  static promoteReadyJobs()               { return JobRegistry.#getInstance().promoteReadyJobs(); }
  static hasJob()                         { return JobRegistry.#getInstance().hasJob(); }
  static hasReadyJob()                    { return JobRegistry.#getInstance().hasReadyJob(); }
  static stats()                          { return JobRegistry.#getInstance().stats(); }
}

export { JobRegistry };
```

Note: `console.log` debug lines in `build()`/`reset()` should NOT be added.

---

#### Step 2 — Update `Application.js`

**File:** `source/lib/services/Application.js`

- `#initRegistries`: replace `new JobRegistry(...)` with `JobRegistry.build(...)`. Remove `jobRegistry`
  from the method signature — no more injection.
- `buildEngine()`: remove `jobRegistry` from the Engine constructor call.
- `buildWebServer()`: remove `jobRegistry` from the WebServer call.
- `enqueueFirstJobs()`: replace `this.jobRegistry.enqueue(...)` with `JobRegistry.enqueue(...)`.
  Remove `jobRegistry: this.jobRegistry` from the params object.
- Remove `this.jobRegistry` property entirely (it is no longer needed by anything else).

```javascript
#initRegistries() {
  JobFactory.build('ResourceRequestJob', { attributes: { clients: this.config.clientRegistry } });
  JobFactory.build('Action', { klass: ActionProcessingJob });

  JobRegistry.build({ cooldown: this.config.workersConfig.retryCooldown });

  this.workersRegistry = new WorkersRegistry({
    workers: this.#workers,
    ...this.config.workersConfig
  });
  this.workersRegistry.initWorkers();
}

buildEngine() {
  return new Engine({ workersRegistry: this.workersRegistry });
}

buildWebServer() {
  return WebServer.build({
    webConfig:       this.config.webConfig,
    workersRegistry: this.workersRegistry,
  });
}

enqueueFirstJobs() {
  new ResourceRequestCollector(this.config.resourceRegistry)
    .requestsNeedingNoParams()
    .forEach((resourceRequest) => {
      JobRegistry.enqueue('ResourceRequestJob', { resourceRequest, parameters: {} });
    });
}
```

---

#### Step 3 — Update `Worker.js`

**File:** `source/lib/models/Worker.js`

- Import `JobRegistry`.
- Remove `jobRegistry` from constructor params and remove `this.jobRegistry` assignment.
- Replace `this.jobRegistry.finish(this.job)` → `JobRegistry.finish(this.job)`.
- Replace `this.jobRegistry.fail(this.job)` → `JobRegistry.fail(this.job)`.

---

#### Step 4 — Update `DummyWorker.js`

**File:** `source/spec/support/dummies/models/DummyWorker.js`

- Import `JobRegistry`.
- Replace `this.jobRegistry.finish(this.job)` → `JobRegistry.finish(this.job)`.
- Replace `this.jobRegistry.fail(this.job)` → `JobRegistry.fail(this.job)`.

---

#### Step 5 — Update `WorkerFactory.js`

**File:** `source/lib/factories/WorkerFactory.js`

- Remove `#jobRegistry` private field.
- Remove `jobRegistry` from constructor params.
- Remove `jobRegistry: this.#jobRegistry` from the `super.build(...)` call.

---

#### Step 6 — Update `WorkersRegistry.js`

**File:** `source/lib/registry/WorkersRegistry.js`

- Remove `#jobRegistry` private field.
- Remove `jobRegistry` from constructor params and from the default `factory` creation.

```javascript
constructor({
  quantity,
  factory = new WorkerFactory({ workerRegistry: this }),
  workers = new IdentifyableCollection(),
  busy    = new IdentifyableCollection(),
  idle    = new IdentifyableCollection()
}) { ... }
```

---

#### Step 7 — Update `WorkersAllocator.js`

**File:** `source/lib/services/WorkersAllocator.js`

- Import `JobRegistry`.
- Remove `jobRegistry` from constructor params and remove `this.jobRegistry` assignment.
- Replace `this.jobRegistry.pick()` → `JobRegistry.pick()`.
- Replace `this.jobRegistry.hasReadyJob()` → `JobRegistry.hasReadyJob()`.

---

#### Step 8 — Update `Engine.js`

**File:** `source/lib/services/Engine.js`

- Import `JobRegistry`.
- Remove `#jobRegistry` private field.
- Remove `jobRegistry` from constructor params and from the `WorkersAllocator` construction.
- Replace `this.#jobRegistry.promoteReadyJobs()` → `JobRegistry.promoteReadyJobs()`.
- Replace `this.#jobRegistry.hasReadyJob()` → `JobRegistry.hasReadyJob()`.
- Replace `this.#jobRegistry.hasJob()` → `JobRegistry.hasJob()`.

---

#### Step 9 — Update `ActionEnqueuer.js`

**File:** `source/lib/models/ActionEnqueuer.js`

- Import `JobRegistry`.
- Remove `#jobRegistry` private field and `jobRegistry` constructor param.
- Replace `this.#jobRegistry.enqueue(...)` → `JobRegistry.enqueue(...)`.

---

#### Step 10 — Update `ActionsEnqueuer.js`

**File:** `source/lib/models/ActionsEnqueuer.js`

- Remove `#jobRegistry` private field and `jobRegistry` constructor param.
- Remove the `jobRegistry` argument passed to `new ActionEnqueuer(...)`.

---

#### Step 11 — Update `ResourceRequest.js`

**File:** `source/lib/models/ResourceRequest.js`

- Remove the `jobRegistry` parameter from `enqueueActions(rawBody, jobRegistry)`.
- Remove the `jobRegistry` argument passed to `new ActionsEnqueuer(...)`.

---

#### Step 12 — Update `ResourceRequestJob.js`

**File:** `source/lib/models/ResourceRequestJob.js`

- Remove `#jobRegistry` private field.
- Remove `jobRegistry` from constructor params.
- Update the `enqueueActions` call to `this.#resourceRequest.enqueueActions(response.data)`.

---

#### Step 13 — Update `StatsRequestHandler.js`

**File:** `source/lib/server/StatsRequestHandler.js`

- Import `JobRegistry`.
- Remove `#jobRegistry` private field and `jobRegistry` constructor param.
- Replace `this.#jobRegistry.stats()` → `JobRegistry.stats()`.

---

#### Step 14 — Update `Router.js`

**File:** `source/lib/server/Router.js`

- Remove `#jobRegistry` private field and `jobRegistry` constructor param.
- Remove `jobRegistry` from the `new StatsRequestHandler(...)` call.

---

#### Step 15 — Update `WebServer.js`

**File:** `source/lib/server/WebServer.js`

- Remove `jobRegistry` from constructor params, `new Router(...)` call, and `static build(...)`.

---

### 4. Test Updates

All tests that currently instantiate `JobRegistry` directly or inject it must be updated to use the
singleton. The general pattern is:

```javascript
import { JobRegistry } from '../../../lib/registry/JobRegistry.js';

beforeEach(() => {
  JobRegistry.reset();
  JobRegistry.build({ cooldown: -1 }); // negative cooldown disables wait in tests
});

afterEach(() => {
  JobRegistry.reset();
});
```

File-by-file changes:

| File | Change |
|------|--------|
| `spec/lib/registry/JobRegistry_spec.js` | Remove all `lock()`/`hasLock()` tests. Update remaining tests to use `JobRegistry.build()`/`reset()` and call static methods. |
| `spec/lib/models/Worker_spec.js` | Remove `jobRegistry` from `new Worker(...)` and `new WorkersRegistry(...)`. Add `JobRegistry.build()`/`reset()` lifecycle. Remove the "stores the job registry" constructor test. Observe `finished`/`failed` state via the collections passed to `JobRegistry.build()`. |
| `spec/lib/factories/WorkerFactory_spec.js` | Remove `jobRegistry` from factory and `WorkersRegistryFactory.build()`. Add `JobRegistry.build()`/`reset()` lifecycle. |
| `spec/lib/registry/WorkersRegistry_spec.js` | Remove `jobRegistry` from `new WorkersRegistry(...)`. Add `JobRegistry.build()`/`reset()` lifecycle. Remove assertion `expect(workers.byIndex(0).jobRegistry).toEqual(jobRegistry)`. |
| `spec/lib/services/WorkersAllocator_spec.js` | Remove `jobRegistry` from allocator and registry construction. Add `JobRegistry.build()`/`reset()` lifecycle. Use `JobRegistry.enqueue()`, `JobRegistry.hasJob()`, etc. for setup and assertions. |
| `spec/lib/services/Engine_spec.js` | Remove `jobRegistry` from `new Engine(...)`. Add `JobRegistry.build()`/`reset()` lifecycle. Use `JobRegistry.enqueue()` for setup and `JobRegistry.hasJob()` for assertions. |
| `spec/lib/services/Application_spec.js` | Remove `jobRegistry` injection from `loadConfig(...)`. Add `JobRegistry.reset()` in `afterEach`. Use `JobRegistry.hasJob()` for assertions. |
| `spec/lib/models/ResourceRequestJob_spec.js` | Remove `jobRegistry` from constructor. Update `enqueueActions` call expectation (no second arg). |
| `spec/lib/models/ResourceRequest_spec.js` | Remove `jobRegistry` spy from `enqueueActions(rawBody, jobRegistry)` calls. Update to `enqueueActions(rawBody)`. Spy on `JobRegistry.enqueue` for assertions. Add `JobRegistry.build()`/`reset()` lifecycle. |
| `spec/lib/models/ActionsEnqueuer_spec.js` | Remove `jobRegistry` spy from constructor. Spy on `JobRegistry.enqueue` instead. Add `JobRegistry.build()`/`reset()` lifecycle. |
| `spec/lib/models/ActionEnqueuer_spec.js` | Same as above. |
| `spec/lib/server/StatsRequestHandler_spec.js` | Remove `jobRegistry` mock from constructor. Add `JobRegistry.build()`/`reset()` lifecycle. Use `JobRegistry.stats()` for verification or spy on it. |
| `spec/lib/server/WebServer_spec.js` | Remove `jobRegistry` from `WebServer.build(...)` calls. Add `JobRegistry.build()`/`reset()` lifecycle where stats are needed. |
| `spec/lib/server/Router_spec.js` | Remove `jobRegistry` from `new Router(...)`. |
| `spec/support/factories/WorkersRegistryFactory.js` | Remove `jobRegistry` param and `JobRegistryFactory.build()` default. |

### 5. Implementation Checklist

**Source files:**
- [ ] `source/lib/registry/JobRegistry.js` — singleton wrapper, remove `lock()`/`hasLock()`, no `JobRegistryInstance` export
- [ ] `source/lib/services/Application.js` — use `JobRegistry.build()`, remove all `jobRegistry` passing
- [ ] `source/lib/models/Worker.js` — static `JobRegistry.finish()`/`fail()`, remove constructor param
- [ ] `source/spec/support/dummies/models/DummyWorker.js` — same as Worker
- [ ] `source/lib/factories/WorkerFactory.js` — remove `#jobRegistry` entirely
- [ ] `source/lib/registry/WorkersRegistry.js` — remove `#jobRegistry` entirely
- [ ] `source/lib/services/WorkersAllocator.js` — static `JobRegistry.pick()`/`hasReadyJob()`, remove constructor param
- [ ] `source/lib/services/Engine.js` — static `JobRegistry.*`, remove constructor param
- [ ] `source/lib/models/ActionEnqueuer.js` — static `JobRegistry.enqueue()`, remove constructor param
- [ ] `source/lib/models/ActionsEnqueuer.js` — remove `jobRegistry` forwarding
- [ ] `source/lib/models/ResourceRequest.js` — remove `jobRegistry` param from `enqueueActions`
- [ ] `source/lib/models/ResourceRequestJob.js` — remove `#jobRegistry`, update `enqueueActions` call
- [ ] `source/lib/server/StatsRequestHandler.js` — static `JobRegistry.stats()`, remove constructor param
- [ ] `source/lib/server/Router.js` — remove `#jobRegistry`, update `StatsRequestHandler` construction
- [ ] `source/lib/server/WebServer.js` — remove `jobRegistry` from constructor and `build()`

**Test files:**
- [ ] `spec/lib/registry/JobRegistry_spec.js` — remove lock/hasLock tests, update to static API
- [ ] `spec/lib/models/Worker_spec.js` — remove `jobRegistry`, add singleton lifecycle
- [ ] `spec/lib/factories/WorkerFactory_spec.js` — remove `jobRegistry`
- [ ] `spec/lib/registry/WorkersRegistry_spec.js` — remove `jobRegistry`
- [ ] `spec/lib/services/WorkersAllocator_spec.js` — use singleton
- [ ] `spec/lib/services/Engine_spec.js` — use singleton
- [ ] `spec/lib/services/Application_spec.js` — remove injection, use singleton
- [ ] `spec/lib/models/ResourceRequestJob_spec.js` — remove `jobRegistry`
- [ ] `spec/lib/models/ResourceRequest_spec.js` — update `enqueueActions`, spy on `JobRegistry.enqueue`
- [ ] `spec/lib/models/ActionsEnqueuer_spec.js` — spy on `JobRegistry.enqueue`
- [ ] `spec/lib/models/ActionEnqueuer_spec.js` — spy on `JobRegistry.enqueue`
- [ ] `spec/lib/server/StatsRequestHandler_spec.js` — use singleton, remove mock
- [ ] `spec/lib/server/WebServer_spec.js` — remove `jobRegistry`
- [ ] `spec/lib/server/Router_spec.js` — remove `jobRegistry`
- [ ] `spec/support/factories/WorkersRegistryFactory.js` — remove `jobRegistry`

### 6. Rollback Plan

This refactoring is large but purely mechanical — every change is a removal of a parameter or a
substitution of `this.x.method()` → `X.method()`. If any step introduces a regression, revert
the affected file(s) individually via git and re-run the test suite to isolate the failure.
The git history should have one commit per step to make targeted reversion easy.

Navi Project

Implementation Plan: Refactor WorkersRegistry to Singleton Pattern with Static Delegation

A complete removal of WorkersRegistry dependency injection across the entire codebase.

10 de abril de 2026

---

### 1. Prerequisites

This plan assumes issue #210 (JobRegistry singleton) is already implemented. The post-#210 state is:

- `Engine` already uses static `JobRegistry.*` methods but still receives `workersRegistry` by injection.
- `WorkersAllocator` already uses static `JobRegistry.*` but still receives `workersRegistry` by injection.
- `Application` still holds `this.workersRegistry` and passes it to `buildEngine()`, `buildWebServer()`, and `#initRegistries()`.
- `Worker` still holds `this.workerRegistry` and calls `this.workerRegistry.setIdle(this.id)`.
- `WorkerFactory` still holds `#workerRegistry` and passes it to Worker.
- `WorkersRegistry.#buildWorker()` still passes `workerRegistry: this` to the factory.
- `WebServer`, `Router`, `StatsRequestHandler` still receive `workersRegistry` by injection.

---

### 2. The Problem

`workersRegistry` is threaded through the same layers that `jobRegistry` was, for the same reasons. After #210, the pattern is clear: registries should be singletons accessed via static methods.

Current chain:
```
Application
  ├─ this.workersRegistry = new WorkersRegistry({ quantity, workers })
  ├─ buildEngine()          → Engine({ workersRegistry })
  │   └─ WorkersAllocator({ workersRegistry })
  ├─ buildWebServer()       → WebServer({ workersRegistry })
  │   └─ Router({ workersRegistry })
  │       └─ StatsRequestHandler({ workersRegistry })
  └─ WorkersRegistry.#buildWorker() → WorkerFactory({ workerRegistry: this })
                                         └─ Worker({ workerRegistry })
```

---

### 3. Implementation Plan

10 steps, working from the inside out. Follows the exact same pattern as the JobRegistry refactoring.

---

#### Step 1 — Refactor `WorkersRegistry.js`

**File:** `source/lib/registry/WorkersRegistry.js`

Rename the existing `WorkersRegistry` class to `WorkersRegistryInstance` (not exported).
Create a new `WorkersRegistry` class as a static-only wrapper, identical in structure to `JobRegistry`.
Export only `WorkersRegistry`.

```javascript
import { WorkerFactory } from '../factories/WorkerFactory.js';
import { IdentifyableCollection } from '../utils/collections/IdentifyableCollection.js';

class WorkersRegistryInstance {
  #factory;
  #quantity;
  #workers;
  #busy;
  #idle;

  constructor({
    quantity,
    factory = new WorkerFactory(),
    workers = new IdentifyableCollection(),
    busy    = new IdentifyableCollection(),
    idle    = new IdentifyableCollection()
  }) {
    this.#factory  = factory;
    this.#quantity = quantity;
    this.#workers  = workers;
    this.#busy     = busy;
    this.#idle     = idle;
  }

  initWorkers()           { ... }  // unchanged
  setBusy(worker_id)      { ... }  // unchanged
  setIdle(worker_id)      { ... }  // unchanged
  hasBusyWorker()         { ... }  // unchanged
  hasIdleWorker()         { ... }  // unchanged
  getIdleWorker()         { ... }  // unchanged
  stats()                 { ... }  // unchanged

  #buildWorker() {
    const worker = this.#factory.build();  // no longer passes workerRegistry
    this.#workers.push(worker);
    this.#idle.push(worker);
    return worker;
  }
}

class WorkersRegistry {
  static #instance = null;

  static build(options = {}) {
    if (WorkersRegistry.#instance) {
      throw new Error('WorkersRegistry.build() has already been called. Call reset() first.');
    }
    WorkersRegistry.#instance = new WorkersRegistryInstance(options);
    return WorkersRegistry.#instance;
  }

  static #getInstance() {
    if (!WorkersRegistry.#instance) {
      throw new Error('WorkersRegistry has not been built. Call WorkersRegistry.build() first.');
    }
    return WorkersRegistry.#instance;
  }

  static reset() {
    WorkersRegistry.#instance = null;
  }

  static initWorkers()      { return WorkersRegistry.#getInstance().initWorkers(); }
  static setBusy(id)        { return WorkersRegistry.#getInstance().setBusy(id); }
  static setIdle(id)        { return WorkersRegistry.#getInstance().setIdle(id); }
  static hasBusyWorker()    { return WorkersRegistry.#getInstance().hasBusyWorker(); }
  static hasIdleWorker()    { return WorkersRegistry.#getInstance().hasIdleWorker(); }
  static getIdleWorker()    { return WorkersRegistry.#getInstance().getIdleWorker(); }
  static stats()            { return WorkersRegistry.#getInstance().stats(); }
}

export { WorkersRegistry };
```

Note: the `factory` default in `WorkersRegistryInstance` is now `new WorkerFactory()` (no `workerRegistry: this`) because `Worker` will no longer need the registry injected.

---

#### Step 2 — Update `Worker.js`

**File:** `source/lib/models/Worker.js`

- Import `WorkersRegistry`.
- Remove `workerRegistry` from constructor params and `this.workerRegistry` assignment.
- Replace `this.workerRegistry.setIdle(this.id)` → `WorkersRegistry.setIdle(this.id)`.

---

#### Step 3 — Update `DummyWorker.js`

**File:** `source/spec/support/dummies/models/DummyWorker.js`

- Import `WorkersRegistry`.
- Replace `this.workerRegistry.setIdle(this.id)` → `WorkersRegistry.setIdle(this.id)`.

---

#### Step 4 — Update `WorkerFactory.js`

**File:** `source/lib/factories/WorkerFactory.js`

- Remove `#workerRegistry` private field.
- Remove `workerRegistry` from constructor params.
- Remove `workerRegistry: workerRegistry || this.#workerRegistry` from the `super.build(...)` call.

```javascript
class WorkerFactory extends Factory {
  constructor({ klass = Worker, attributesGenerator = new IdGenerator() } = {}) {
    super({ klass, attributesGenerator });
  }

  build() {
    return super.build({});
  }
}
```

---

#### Step 5 — Update `WorkersAllocator.js`

**File:** `source/lib/services/WorkersAllocator.js`

- Import `WorkersRegistry`.
- Remove `workersRegistry` from constructor params and `this.workersRegistry` assignment.
- Replace `this.workersRegistry.getIdleWorker()` → `WorkersRegistry.getIdleWorker()`.
- Replace `this.workersRegistry.hasIdleWorker()` → `WorkersRegistry.hasIdleWorker()`.

---

#### Step 6 — Update `Engine.js`

**File:** `source/lib/services/Engine.js`

- Import `WorkersRegistry`.
- Remove `#workersRegistry` private field.
- Remove `workersRegistry` from constructor params.
- Remove `workersRegistry: this.#workersRegistry` from the `WorkersAllocator` construction.
- Replace `this.#workersRegistry.hasBusyWorker()` → `WorkersRegistry.hasBusyWorker()`.

```javascript
constructor({ allocator, sleepMs = 500 }) {
  this.#sleepMs = sleepMs;
  this.allocator = allocator || new WorkersAllocator();
}

#continueAllocating() {
  return JobRegistry.hasJob() || WorkersRegistry.hasBusyWorker();
}
```

---

#### Step 7 — Update `StatsRequestHandler.js`

**File:** `source/lib/server/StatsRequestHandler.js`

- Import `WorkersRegistry`.
- Remove `#workersRegistry` private field and `workersRegistry` constructor param.
- Replace `this.#workersRegistry.stats()` → `WorkersRegistry.stats()`.

```javascript
constructor() {
  super();
}

handle(_req, res) {
  res.json({
    jobs:    JobRegistry.stats(),
    workers: WorkersRegistry.stats(),
  });
}
```

Note: after #210, `JobRegistry` is already static so `StatsRequestHandler` can also stop receiving `jobRegistry`. Both stats calls become fully static.

---

#### Step 8 — Update `Router.js`

**File:** `source/lib/server/Router.js`

- Remove `#workersRegistry` private field and `workersRegistry` constructor param.
- Remove `workersRegistry` from the `new StatsRequestHandler(...)` call.

```javascript
constructor() {}

build() {
  const router = ExpressRouter();
  const register = new RouteRegister(router);

  register.register({
    route:   '/stats.json',
    handler: new StatsRequestHandler(),
  });
  // ... static file serving unchanged
}
```

---

#### Step 9 — Update `WebServer.js`

**File:** `source/lib/server/WebServer.js`

- Remove `workersRegistry` from constructor params, `new Router(...)` call, and `static build(...)`.

```javascript
constructor({ port }) {
  this.#port = port;
  this.#app = express();
  this.#app.use(new Router().build());
}

static build({ webConfig }) {
  if (!webConfig) return null;
  return new WebServer({ port: webConfig.port });
}
```

---

#### Step 10 — Update `Application.js`

**File:** `source/lib/services/Application.js`

- Replace `new WorkersRegistry(...)` with `WorkersRegistry.build(...)`.
- Replace `this.workersRegistry.initWorkers()` with `WorkersRegistry.initWorkers()`.
- Remove `this.workersRegistry` property entirely.
- Remove `workersRegistry` from `#initRegistries()` signature (no more injection).
- Remove `workersRegistry` from `buildEngine()` and `buildWebServer()` calls.

```javascript
#initRegistries() {
  JobFactory.build('ResourceRequestJob', { attributes: { clients: this.config.clientRegistry } });
  JobFactory.build('Action', { klass: ActionProcessingJob });

  JobRegistry.build({ cooldown: this.config.workersConfig.retryCooldown });

  WorkersRegistry.build({
    workers: this.#workers,
    ...this.config.workersConfig,
  });
  WorkersRegistry.initWorkers();
}

buildEngine() {
  return new Engine();
}

buildWebServer() {
  return WebServer.build({ webConfig: this.config.webConfig });
}
```

---

### 4. Test Updates

General pattern — identical to what was established for `JobRegistry`:

```javascript
import { WorkersRegistry } from '../../../lib/registry/WorkersRegistry.js';

beforeEach(() => {
  WorkersRegistry.reset();
  WorkersRegistry.build({ quantity: 1 });
  WorkersRegistry.initWorkers();
});

afterEach(() => {
  WorkersRegistry.reset();
});
```

File-by-file changes:

| File | Change |
|------|--------|
| `spec/lib/registry/WorkersRegistry_spec.js` | Update to use `WorkersRegistry.build()`/`reset()` and call static methods for all assertions. Inject test collections (`workers`, `busy`, `idle`) via `WorkersRegistry.build({ quantity, workers, busy, idle })`. |
| `spec/lib/models/Worker_spec.js` | Remove `workerRegistry` from `new Worker(...)`. Add `WorkersRegistry.build()`/`reset()` lifecycle. Remove "stores the worker registry" constructor assertion. |
| `spec/lib/factories/WorkerFactory_spec.js` | Remove `workerRegistry` from factory construction. Add `WorkersRegistry.build()`/`reset()` if workers are exercised. |
| `spec/lib/services/WorkersAllocator_spec.js` | Remove `workersRegistry` from allocator. Use `WorkersRegistry.build()`/`reset()` for state setup. Use static methods or injected collections for assertions. |
| `spec/lib/services/Engine_spec.js` | Remove `workersRegistry` from `new Engine(...)`. Use `WorkersRegistry.build()`/`reset()`. Keep `DummyWorkerFactory` injection via `WorkersRegistry.build({ factory: workerFactory })`. |
| `spec/lib/services/Application_spec.js` | Remove `workersRegistry` injection from `loadConfig(...)`. Add `WorkersRegistry.reset()` to `afterEach`. Assert worker state via `WorkersRegistry` static methods. |
| `spec/lib/server/StatsRequestHandler_spec.js` | Remove `workersRegistry` mock. Add `WorkersRegistry.build()`/`reset()`. Use `WorkersRegistry.build({ idle, busy })` to control stats state. |
| `spec/lib/server/WebServer_spec.js` | Remove `workersRegistry` from `WebServer.build(...)` calls. Add `WorkersRegistry.build()`/`reset()` where needed. |
| `spec/lib/server/Router_spec.js` | Remove `workersRegistry` from `new Router(...)`. Add `WorkersRegistry.build()`/`reset()` if stats are exercised. |
| `spec/support/factories/WorkersRegistryFactory.js` | Update `build()` to call `WorkersRegistry.build(options)` instead of `new WorkersRegistry(options)`. |

---

### 5. Implementation Checklist

**Source files:**
- [ ] `source/lib/registry/WorkersRegistry.js` — singleton wrapper (`WorkersRegistryInstance` + `WorkersRegistry`), `factory` default without `workerRegistry`
- [ ] `source/lib/models/Worker.js` — static `WorkersRegistry.setIdle()`, remove `workerRegistry` constructor param
- [ ] `source/spec/support/dummies/models/DummyWorker.js` — same as Worker
- [ ] `source/lib/factories/WorkerFactory.js` — remove `#workerRegistry` entirely, `build()` passes no `workerRegistry`
- [ ] `source/lib/services/WorkersAllocator.js` — static `WorkersRegistry.*`, remove constructor param
- [ ] `source/lib/services/Engine.js` — static `WorkersRegistry.hasBusyWorker()`, remove `#workersRegistry` and constructor param
- [ ] `source/lib/server/StatsRequestHandler.js` — static `WorkersRegistry.stats()` and `JobRegistry.stats()`, remove both constructor params
- [ ] `source/lib/server/Router.js` — remove `#workersRegistry`, `new StatsRequestHandler()` with no args
- [ ] `source/lib/server/WebServer.js` — remove `workersRegistry` from constructor and `build()`
- [ ] `source/lib/services/Application.js` — `WorkersRegistry.build()`, `WorkersRegistry.initWorkers()`, remove `this.workersRegistry`

**Test files:**
- [ ] `spec/lib/registry/WorkersRegistry_spec.js` — use singleton lifecycle
- [ ] `spec/lib/models/Worker_spec.js` — remove `workerRegistry`, singleton lifecycle
- [ ] `spec/lib/factories/WorkerFactory_spec.js` — remove `workerRegistry`
- [ ] `spec/lib/services/WorkersAllocator_spec.js` — singleton lifecycle
- [ ] `spec/lib/services/Engine_spec.js` — singleton lifecycle, no `workersRegistry` param
- [ ] `spec/lib/services/Application_spec.js` — no `workersRegistry` injection, `WorkersRegistry.reset()` in afterEach
- [ ] `spec/lib/server/StatsRequestHandler_spec.js` — no `workersRegistry` mock, singleton lifecycle
- [ ] `spec/lib/server/WebServer_spec.js` — remove `workersRegistry`
- [ ] `spec/lib/server/Router_spec.js` — remove `workersRegistry`
- [ ] `spec/support/factories/WorkersRegistryFactory.js` — use `WorkersRegistry.build()`

---

### 6. Rollback Plan

All changes are mechanical substitutions (remove param / replace instance call with static call).
Each step should be its own commit to allow targeted reversion. Revert individual files via git if
any step introduces a regression; the test suite will identify the exact failure point.

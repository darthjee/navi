# Plan: Refactor JobFactory to use static registry, get, and reset methods

## Overview

Add three static methods to `JobFactory` (`registry`, `get`, `reset`) to centralize factory
management. `Application` registers the factory globally on startup; `JobRegistry` fetches it
via `JobFactory.get()` instead of instantiating its own factory.

## Context

### Current flow

```
Application.#initRegistries()
  → new JobRegistry({ clients, cooldown })      # passes clients for internal factory creation
      → new JobFactory({ attributes: { clients } })  # factory created inside JobRegistry
```

### New flow

```
Application.#initRegistries()
  → JobFactory.registry("ResourceRequestJob", new JobFactory({ attributes: { clients } }))
  → new JobRegistry({ cooldown })               # no longer receives clients
      → JobFactory.get("ResourceRequestJob")    # fetches the registered factory
```

---

## Implementation Steps

### Step 1 — Add static methods to `JobFactory`

`source/lib/factories/JobFactory.js`:

Add a static `#factories` map and three static methods:

```js
static #factories = new Map();

/** Registers a factory under the given name. */
static registry(name, factory) {
  JobFactory.#factories.set(name, factory);
}

/** Retrieves a registered factory by name. Returns undefined if not found. */
static get(name) {
  return JobFactory.#factories.get(name);
}

/** Removes all registered factories. Useful for test isolation. */
static reset() {
  JobFactory.#factories.clear();
}
```

### Step 2 — Update `Application` to register the factory

`source/lib/services/Application.js`:

In `#initRegistries`, create and register the `JobFactory` before building the `JobRegistry`:

```js
#initRegistries({ jobRegistry, workersRegistry } = {}) {
  JobFactory.build('ResourceRequestJob', { attributes: { clients: this.config.clientRegistry } });

  this.jobRegistry = jobRegistry || new JobRegistry({ cooldown: this.config.workersConfig.retryCooldown });
  // ... rest unchanged
}
```

### Step 3 — Update `JobRegistry` to fetch the factory via `JobFactory.get()`

`source/lib/registry/JobRegistry.js`:

Replace the internal factory construction:

```js
// Before:
this.#factory = factory || new JobFactory({ attributes: { clients } });

// After:
this.#factory = factory || JobFactory.get('ResourceRequestJob');
```

Remove `clients` from the constructor parameter (or keep it for backward-compatibility but
stop using it for factory creation).

### Step 4 — Update `docs/agents/architecture.md`

Update the `JobFactory` entry in the services table to describe the new static registry pattern.

### Step 5 — Update tests

- `source/spec/lib/factories/JobFactory_spec.js`:
  - Add `beforeEach(() => JobFactory.reset())` and `afterEach(() => JobFactory.reset())` for test isolation.
  - Add `describe('.registry / .get / .reset')` block covering: registry stores a factory, get retrieves it by name, reset clears all entries.

- `source/spec/lib/registry/JobRegistry_spec.js`:
  - Register a factory via `JobFactory.registry(...)` in `beforeEach` and reset in `afterEach`.
  - Remove `clients` from `JobRegistry` constructor calls where it was only used for factory creation.

- `source/spec/lib/services/Application_spec.js`:
  - Add `afterEach(() => JobFactory.reset())` to clean up the globally registered factory after each test.

---

## Files to Change

| File | Change |
|------|--------|
| `source/lib/factories/JobFactory.js` | Add static `#factories`, `registry()`, `get()`, `reset()` |
| `source/lib/services/Application.js` | Create and register `JobFactory` before building `JobRegistry`; remove `clients` from `JobRegistry` constructor call |
| `source/lib/registry/JobRegistry.js` | Replace `new JobFactory(...)` with `JobFactory.get('ResourceRequestJob')`; remove `clients` param dependency |
| `docs/agents/architecture.md` | Update `JobFactory` description in the services table |
| `source/spec/lib/factories/JobFactory_spec.js` | Add tests for static methods; add `reset()` in `beforeEach`/`afterEach` |
| `source/spec/lib/registry/JobRegistry_spec.js` | Register factory in `beforeEach`; reset in `afterEach` |
| `source/spec/lib/services/Application_spec.js` | Add `afterEach(() => JobFactory.reset())` |

## CI Checks

Before opening a PR, run inside the `navi_app` container:
- `cd source; yarn test` (CircleCI job: `jasmine`)
- `cd source; yarn lint` (CircleCI job: `checks`)

## Notes

- `JobFactory.get()` returns `undefined` if no factory is registered — `JobRegistry` should handle
  this gracefully. A safe default (e.g. throw a descriptive error or fall back) should be decided
  before implementation.
- `reset()` must be called in test teardown to prevent factory state leaking between specs,
  since the static map is module-level and shared across all tests in the same process.

# Plan: Refactor Job class: create base class and rename current Job

## Overview

Refactor the current `Job` class into a base class (keeping the name `Job`) that holds shared lifecycle methods and enforces the `perform` contract, then create a new `ResourceRequestJob` that extends `Job` with the existing `ResourceRequest`-specific logic. Update `JobFactory` to accept generic `attributes` instead of a specific `clients` parameter.

## Context

The `Job` class in `source/lib/models/` currently handles both generic job lifecycle concerns (`readyBy`, `applyCooldown`, `isReadyBy`, `exhausted`, `_fail`) and `ResourceRequest`-specific logic (`perform`). As more job types are added in the future, this coupling creates naming confusion and code duplication. Separating concerns now makes the codebase cleaner and extensible.

## Implementation Steps

### Step 1 — Refactor `Job` into a base class

Modify `source/lib/models/Job.js` to become the base class:
- Keep all lifecycle methods: `readyBy`, `applyCooldown`, `isReadyBy`, `exhausted`, `_fail`.
- Replace the `perform()` implementation with an abstract stub that throws if not overridden:

```javascript
perform() {
  throw new Error('You must implement the perform method in a subclass');
}
```

- Remove `ResourceRequest`-specific fields (`#resourceRequest`, `#parameters`, `#clients`, `#client`) from the constructor — those move to `ResourceRequestJob`.
- Update JSDoc to reflect the new role as a base class.

### Step 2 — Create `ResourceRequestJob`

Create `source/lib/models/ResourceRequestJob.js` with:
- Extends `Job`.
- Constructor receives `{ id, resourceRequest, parameters, clients }` and calls `super({ id })`.
- Contains the `perform()` implementation and `#getClient()` private method from the current `Job`.
- JSDoc documentation.

### Step 4 — Refactor `JobFactory` to accept generic `attributes`

Currently `JobFactory` stores `clients` as a specific private field and merges it explicitly in `build()`:

```javascript
// current
constructor({ klass = Job, attributesGenerator = new IdGenerator(), clients } = {}) {
  super({ klass, attributesGenerator });
  this.#clients = clients;
}

build({ resourceRequest, parameters }) {
  return super.build({ clients: this.#clients, resourceRequest, parameters });
}
```

Refactor to accept a generic `attributes` object instead. These attributes are merged with the build-time params, making the factory extensible for future job types that may need different constructor arguments:

```javascript
// after
constructor({ klass = ResourceRequestJob, attributesGenerator = new IdGenerator(), attributes = {} } = {}) {
  super({ klass, attributesGenerator });
  this.#attributes = attributes;
}

build(params) {
  return super.build({ ...this.#attributes, ...params });
}
```

`JobRegistry`, which constructs `JobFactory` internally, must be updated accordingly:

```javascript
// before
this.#factory = factory || new JobFactory({ clients });

// after
this.#factory = factory || new JobFactory({ attributes: { clients } });
```

### Step 5 — Update all other references

Search for any remaining imports of `Job` across the codebase. Since `Job` keeps its name, most imports remain valid. Only places that instantiate `Job` directly to perform resource requests (e.g. test support factories, dummies) need to be updated to use `ResourceRequestJob`.

### Step 6 — Update specs

- Keep the existing `Job` spec, updating it to test the base class contract (lifecycle methods + `perform()` throwing).
- Add a new spec `ResourceRequestJob_spec.js` covering the `perform()` implementation.
- Update any test dummy (`DummyJob`) that currently extends or instantiates `Job` if needed.

## Files to Change

- `source/lib/models/Job.js` — refactor into base class: keep lifecycle methods, replace `perform()` with abstract stub, remove `ResourceRequest`-specific fields
- `source/lib/models/ResourceRequestJob.js` — new file: `perform` implementation and `#getClient()` extending `Job`
- `source/lib/factories/JobFactory.js` — replace `clients` field with generic `attributes`; update default `klass` to `ResourceRequestJob`; update `build()` to spread `this.#attributes` into `super.build()`
- `source/lib/registry/JobRegistry.js` — change `new JobFactory({ clients })` to `new JobFactory({ attributes: { clients } })`
- `source/spec/models/Job_spec.js` — update to test base class contract
- `source/spec/models/ResourceRequestJob_spec.js` — new spec for `perform()` logic
- Any file instantiating `Job` directly for resource requests — update to `ResourceRequestJob`

## Related Files

- [snippets.md](snippets.md) — full code snippets for all changed/new files
- [test_scenarios.md](test_scenarios.md) — spec structure and code snippets for all affected test files

## Notes

- The project uses ES Modules (`import`/`export`), so use `export default` and `import` with `.js` extensions.
- All custom exceptions must extend `AppError`, but the `perform` abstract guard can use a plain `Error` since it is a developer contract violation, not a runtime app error.
- Each commit should be atomic: one logical change per commit (e.g., refactor `Job` into base, then create `ResourceRequestJob`, then refactor `JobFactory`, then update references).

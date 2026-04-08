# Plan: Refactor Job class: create base class and rename current Job

## Overview

Split the current `Job` model into two classes: a `BaseJob` that holds shared lifecycle methods and enforces the `perform` contract, and a `ResourceRequestJob` that extends it with the existing `ResourceRequest`-specific logic. Update all references throughout the codebase.

## Context

The `Job` class in `source/lib/models/` currently handles both generic job lifecycle concerns (`readyBy`, `applyCooldown`, `isReadyBy`, `exhausted`, `_fail`) and `ResourceRequest`-specific logic (`perform`). As more job types are added in the future, this coupling creates naming confusion and code duplication. Separating concerns now makes the codebase cleaner and extensible.

## Implementation Steps

### Step 1 — Create `BaseJob`

Create `source/lib/models/BaseJob.js` with:
- All lifecycle methods that are not specific to `ResourceRequest`: `readyBy`, `applyCooldown`, `isReadyBy`, `exhausted`, `_fail`.
- An abstract `perform()` method that throws `Error('You must implement the perform method in a subclass')`.
- JSDoc documentation for the class and all methods.

### Step 2 — Create `ResourceRequestJob`

Create `source/lib/models/ResourceRequestJob.js` with:
- Extends `BaseJob`.
- Contains only the `perform()` implementation (the existing `ResourceRequest`-specific logic from `Job`).
- JSDoc documentation.

### Step 3 — Remove the old `Job` class

Delete (or empty and replace) `source/lib/models/Job.js`. The file can be removed since `BaseJob` and `ResourceRequestJob` replace it entirely.

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

Search for any remaining imports of `Job` across the codebase (registries, specs, etc.) and update them to use `BaseJob` or `ResourceRequestJob` as appropriate.

### Step 6 — Update specs

- Rename / move the existing `Job` spec to `ResourceRequestJob` spec.
- Add a spec for `BaseJob` covering the shared lifecycle methods and verifying that `perform()` throws when not overridden.

## Files to Change

- `source/lib/models/Job.js` — remove (replaced by the two new files below)
- `source/lib/models/BaseJob.js` — new file: shared lifecycle methods + abstract `perform`
- `source/lib/models/ResourceRequestJob.js` — new file: `perform` implementation extending `BaseJob`
- `source/lib/factories/JobFactory.js` — replace `clients` field with generic `attributes`; update default `klass` to `ResourceRequestJob`; update `build()` to spread `this.#attributes` into `super.build()`
- `source/lib/registry/JobRegistry.js` — change `new JobFactory({ clients })` to `new JobFactory({ attributes: { clients } })`
- `spec/` — rename Job spec → ResourceRequestJob spec, add BaseJob spec
- Any other file importing `Job` — update import to the appropriate new class

## Notes

- The project uses ES Modules (`import`/`export`), so use `export default` and `import` with `.js` extensions.
- All custom exceptions must extend `AppError`, but the `perform` abstract guard can use a plain `Error` since it is a developer contract violation, not a runtime app error.
- Each commit should be atomic: one logical change per commit (e.g., create `BaseJob`, then create `ResourceRequestJob`, then update references).

# Plan: Make ResourceRegistry Static

## Overview

Refactor `ResourceRegistry` to follow the same singleton pattern already used by `JobRegistry` and `WorkersRegistry`: add a private static `#instance` field, a `build()` factory, static delegation methods (`getItem`, `filter`, `size`), and a `reset()` for test isolation. Update `Config` to call `ResourceRegistry.build()`, update all affected specs to call `ResourceRegistry.reset()` in `afterEach`, and add full unit test coverage for the new static interface.

## Context

`ResourceRegistry` currently has no static interface — it is instantiated with `new ResourceRegistry(resources)` inside `Config`'s constructor. `JobRegistry` and `WorkersRegistry` already implement the singleton pattern (static `build`, static delegation methods, static `reset`). Aligning `ResourceRegistry` removes the inconsistency, simplifies access, and enables proper test isolation.

## Implementation Steps

### Step 1 — Add static singleton to `ResourceRegistry`

Add `static #instance = null` and the following static methods to `ResourceRegistry`:

- `static build(items)` — creates the singleton; throws if already built (mirrors `JobRegistry` guard).
- `static getItem(name)` — delegates to `#instance.getItem(name)`.
- `static filter(predicate)` — delegates to `#instance.filter(predicate)`.
- `static size()` — delegates to `#instance.size()`.
- `static reset()` — sets `#instance = null`.
- Private `static #getInstance()` — throws if `#instance` is null, used internally by the delegation methods.

All new static methods must include JSDoc.

### Step 2 — Update `Config` to use `ResourceRegistry.build()`

Change the `Config` constructor from:

```js
this.resourceRegistry = new ResourceRegistry(resources);
```

to:

```js
this.resourceRegistry = ResourceRegistry.build(resources);
```

`this.resourceRegistry` is kept for backward-compatible access by `Config#getResource()` and `Application#enqueueFirstJobs()`.

### Step 3 — Update `ResourceRegistry_spec.js`

- Add `afterEach(() => ResourceRegistry.reset())` to the top-level `describe` block (instance tests trigger build indirectly in future; static tests definitely need it).
- Add a new `describe` block for all static methods: `build`, `getItem`, `filter`, `size`, `reset`.
- Keep the existing instance-method tests intact.

### Step 4 — Update `Config_spec.js`

Every `new Config(...)` call in the spec now triggers `ResourceRegistry.build()` internally.

- Add `afterEach(() => ResourceRegistry.reset())` to every `describe` block that constructs a `Config` instance (`#getResource`, `#getClient`, `.fromFile`).
- Add `import { ResourceRegistry }` at the top.
- Update the `expectedResourceRegistry` setup in `.fromFile` to use `ResourceRegistry.build(expectedResources)` (and reset in `afterEach`).

### Step 5 — Leave `ResourceRequestCollector` unchanged

`ResourceRequestCollector` receives a registry instance from the caller. `Application#enqueueFirstJobs()` passes `this.config.resourceRegistry` (the instance returned by `ResourceRegistry.build()`). This continues to work without changes. No update to `ResourceRequestCollector.js` or its spec is needed.

## Files to Change

- `source/lib/registry/ResourceRegistry.js` — add `#instance`, `build`, `getItem`, `filter`, `size`, `reset`, `#getInstance` with JSDoc
- `source/lib/models/Config.js` — use `ResourceRegistry.build(resources)` instead of `new ResourceRegistry(resources)`
- `source/spec/lib/registry/ResourceRegistry_spec.js` — add `afterEach` reset + static method tests
- `source/spec/lib/models/Config_spec.js` — add `afterEach` reset + import `ResourceRegistry`

## Notes

- `build()` will throw if called twice without `reset()` in between (same guard as `JobRegistry`). This is intentional — double-build indicates a test-isolation bug.
- Instance methods (`getItem`, `filter`, `size`) are kept as-is on the class; static methods simply delegate to them. No logic is duplicated.
- `ResourceRequestCollector_spec.js` creates `new ResourceRegistry(...)` directly without going through `Config`, so it does **not** touch the singleton and needs no changes.
- The `Config_spec.js` `.fromFile` test currently does `expectedResourceRegistry = new ResourceRegistry(expectedResources)` for comparison — this will need to use `ResourceRegistry.build()` and a corresponding reset.

## CI Checks

Before opening a PR, run the following checks for the folders being modified:

- `source/`: `yarn test` (CircleCI job: `test`) and `yarn lint` (CircleCI job: `lint`)

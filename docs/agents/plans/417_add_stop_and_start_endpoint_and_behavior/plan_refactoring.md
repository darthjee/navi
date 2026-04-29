# Plan: Refactoring — Application Static Singleton

## Context

`Application` is currently a plain instance class. It needs to become a static singleton
facade (same pattern as `JobRegistry` / `WorkersRegistry`) so that `Application.status()`
is accessible from anywhere without threading the instance.

## Implementation

### Step 1 — Create `ApplicationInstance`

Extract all current instance logic from `Application` into a new internal
`ApplicationInstance` class (same file or a companion file — follow the `JobRegistry`
pattern):

- `loadConfig(configPath)`
- `run()`
- `buildEngine()`
- `buildWebServer()`
- `enqueueFirstJobs()`
- `bufferedLogger` getter
- New: `#engineStatus` private field (string)
- New: `#aggregator` private field — the `PromiseAggregator` instance, kept for the lifetime
  of the application so that `continue`/`start` can `add` new Engine promises to it.
- New: `status()` instance method — returns `#engineStatus`
- New: `setStatus(value)` instance method — sets `#engineStatus`

### Step 2 — Build the static facade

`Application` becomes the static facade:

- `Application.build(params)` — creates and stores the singleton `ApplicationInstance`.
- `Application.reset()` — clears the singleton (used in tests).
- `Application.status()` — delegates to `instance.status()`.
- All existing public methods (`loadConfig`, `run`, `buildEngine`, `buildWebServer`,
  `enqueueFirstJobs`) become static and delegate to the instance.

### Step 3 — Initialize status on run

In `ApplicationInstance.run()`:
- Create `this.#aggregator = new PromiseAggregator()` (stored as instance field).
- Set `#engineStatus = 'running'` before starting the Engine.
- `add` both the WebServer and Engine promises to `this.#aggregator`.
- After `this.#aggregator.wait()` resolves (Engine finished normally), set status to `'stopped'`.

### Step 4 — Update call-sites

The current entrypoint (`source/bin/navi.js` or equivalent) constructs an `Application`
instance directly. Update it to call `Application.build(params)` instead, then call the
static methods.

Update all specs:
- `source/spec/lib/services/Application_spec.js` — update for static facade; call
  `Application.reset()` in `afterEach`.

## Files to Change

- `source/lib/services/Application.js` — refactor to static facade + `ApplicationInstance`
- `source/bin/navi.js` (or entrypoint) — update to use static `Application`
- `source/spec/lib/services/Application_spec.js` — update specs

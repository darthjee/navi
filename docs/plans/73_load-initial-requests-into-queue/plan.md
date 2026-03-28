# Plan: Load Initial Parameter-Free ResourceRequests into Queue (#73)

Issue: https://github.com/darthjee/navi/issues/73

## Context

On `main`, `Application#loadConfig` initialises the registries but never enqueues any jobs and
never starts the engine. The CLI (`bin/navi.js`) calls `app.loadConfig(config)` and exits.

The building blocks already exist:
- `ResourceRequest#needsParams()` — detects parameterised URLs.
- `ResourceRequestCollector#requestsNeedingNoParams()` — filters eligible requests from the registry.
- `Engine#start()` — drives the allocation loop until all jobs are done.
- `JobRegistry#enqueue({ resourceRequest, parameters })` — adds a job to the queue.

## Step 1 — Add `Application#enqueueFirstJobs()`

Collect all parameter-free requests via `ResourceRequestCollector` and enqueue each one with an
empty parameters map.

```javascript
enqueueFirstJobs() {
  const collector = new ResourceRequestCollector(this.config.resourceRegistry);
  collector.requestsNeedingNoParams().forEach((resourceRequest) => {
    this.jobRegistry.enqueue({ resourceRequest, parameters: {} });
  });
}
```

**Tests** (`spec/services/Application_spec.js`):
- After `loadConfig` + `enqueueFirstJobs()`, `jobRegistry.hasJob()` is `true`.
- Only parameter-free requests are present (no parameterised URLs in queue).

## Step 2 — Add `Application#buildEngine()`

Instantiate an `Engine` wired to the current registries.

```javascript
buildEngine() {
  return new Engine({
    jobRegistry: this.jobRegistry,
    workersRegistry: this.workersRegistry,
  });
}
```

**Tests**:
- `buildEngine()` returns an `Engine` instance.

## Step 3 — Add `Application#run()`

Orchestrate the full startup sequence.

```javascript
run() {
  this.engine = this.buildEngine();
  this.enqueueFirstJobs();
  this.engine.start();
}
```

**Tests**:
- Calling `run()` results in jobs being processed (queue empties after run with a working worker setup).

## Step 4 — Update `bin/navi.js`

Replace the bare `loadConfig` call with `run()`:

```javascript
// Before
app.loadConfig(config);

// After
app.loadConfig(config);
app.run();
```

## Acceptance Criteria

- [ ] `Application#enqueueFirstJobs()` enqueues only parameter-free requests.
- [ ] `Application#buildEngine()` returns a correctly wired `Engine`.
- [ ] `Application#run()` calls `buildEngine()`, `enqueueFirstJobs()`, and `engine.start()` in order.
- [ ] `bin/navi.js` calls `app.run()` after `app.loadConfig()`.
- [ ] `yarn test` passes with no regressions.

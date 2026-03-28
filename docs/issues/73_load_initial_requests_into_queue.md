# Issue 73: Load Initial Parameter-Free ResourceRequests into Queue

Issue Link: https://github.com/darthjee/navi/issues/73

## Background

When starting the Navi application, the job queue must be pre-populated with `ResourceRequest`
instances that do **not** require URL parameters. This allows the cache-warming process to begin
immediately; parameterized requests (e.g. `/categories/:id/items.json`) are only enqueued later,
once their parameters are discovered from earlier responses.

Currently, `Application` initializes its registries via `loadConfig`, but never starts the engine
and never enqueues any jobs. The CLI (`bin/navi.js`) only calls `app.loadConfig(config)` and then
exits.

## Existing Building Blocks (already on `main`)

- `ResourceRequest#needsParams()` — returns `true` if the URL contains `{:placeholder}` tokens.
- `ResourceRequestCollector` (`lib/utils/`) — wraps a `ResourceRegistry` and exposes
  `requestsNeedingNoParams()` to retrieve all parameter-free requests.

## Proposal

Add an `Application#run()` method that, after `loadConfig`, enqueues all parameter-free requests
and starts the engine. Update the CLI to call `run()`.

### Implementation Steps

1. **`Application#enqueueFirstJobs()`** — use `ResourceRequestCollector` to collect all
   parameter-free `ResourceRequest` instances from `config.resourceRegistry` and enqueue each one
   into `jobRegistry` with an empty parameters map.

2. **`Application#buildEngine()`** — instantiate and return an `Engine` wired to the current
   `jobRegistry` and `workersRegistry`.

3. **`Application#run()`** — call `buildEngine()`, then `enqueueFirstJobs()`, then
   `engine.start()`.

4. **Update CLI** — change `bin/navi.js` to call `app.run()` after `app.loadConfig(config)`.

## Acceptance Criteria

- [ ] `Application#run()` exists and orchestrates engine creation, initial enqueueing, and engine start.
- [ ] On startup, only parameter-free `ResourceRequest` jobs are present in the queue.
- [ ] Parameterized requests are not enqueued at startup.
- [ ] The CLI calls `app.run()` after `app.loadConfig()`.
- [ ] All new behaviour is covered by automated tests (`yarn test` passes).

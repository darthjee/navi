# Plan: Add Job and Worker Attributes When Publishing Logs

## Overview

Introduce a `LogContext` class that carries a fixed set of attributes (`workerId`, `jobId`) and forwards log calls to `LogRegistry` with those attributes merged in. Thread the context from `Worker` down through all objects that log during job execution, so every log entry produced in a job-processing context is automatically tagged with the worker and job that produced it.

## Context

`LogRegistry` already accepts a second `attributes` argument on every log call, but nothing populates it with worker/job metadata today. Classes like `Client`, `ResourceRequestJob`, and `HtmlParser` log directly to `LogRegistry` with empty attributes. The goal is to route those calls through a `LogContext` that injects `{ workerId, jobId }` without requiring every call site to pass them manually.

This also lays the foundation for future API filtering: with `workerId` and `jobId` stored on every log entry, the `/logs.json` endpoint can later filter by those fields.

## Implementation Steps

### Step 1 — Create `LogContext`

Create `source/lib/utils/logging/LogContext.js`.

`LogContext` wraps a fixed attributes object and exposes `debug / info / warn / error` methods that merge its attributes into every call forwarded to `LogRegistry`. Example interface:

```js
const ctx = new LogContext({ workerId: 'w1', jobId: 42 });
ctx.info('Request sent', { url: '/foo' });
// → LogRegistry.info('Request sent', { url: '/foo', workerId: 'w1', jobId: 42 })
```

Add a corresponding spec at `source/spec/lib/utils/logging/LogContext_spec.js`.

### Step 2 — Thread `LogContext` through `Worker`

`Worker` knows both its own ID and the currently assigned job ID. Update `Worker.perform()` to create a `LogContext({ workerId: this.id, jobId: this.job.id })` and pass it to the job's `perform` method.

Update `Worker`'s own error log call to use the context instead of calling `LogRegistry.error` directly.

### Step 3 — Accept context in all Job classes

Update the `perform` method (and constructor or factory attributes as needed) of each job class to accept and store a `logContext` parameter:

- `ResourceRequestJob` — pass context to `Client` and use it for the job's own `debug`/`error` calls.
- `AssetDownloadJob` — pass context to `Client` and use it for its own `debug`/`error` calls.
- `ActionProcessingJob` — use context for its own `debug` call; pass context to `ResourceRequestAction`.
- `HtmlParseJob` — use context for its own `debug` call; pass context to `HtmlParser` / `HtmlElementParser`.

### Step 4 — Accept context in `Client`

Add a `logContext` parameter to `Client.perform()` and `Client.performUrl()` (or inject it at construction time via the job). Replace all direct `LogRegistry.*` calls inside `Client` with `this.#logContext.*` (or a passed-in context).

### Step 5 — Accept context in `ResourceRequestAction`

`ResourceRequestAction.execute()` is called from `ActionProcessingJob`. Pass the context through and replace `LogRegistry.error` with `logContext.error`.

### Step 6 — Accept context in `HtmlParser` / `HtmlElementParser`

`HtmlParseJob` calls `HtmlParser`, which calls `HtmlElementParser`. Pass the context down through both and replace `LogRegistry.warn` calls with `logContext.warn`.

### Step 7 — Update specs

Update specs for all changed classes to pass a mock `logContext` (spy or stub) and assert log calls are made on it rather than on `LogRegistry` directly.

## Files to Change

- `source/lib/utils/logging/LogContext.js` — **new** — wraps attributes and delegates to `LogRegistry`
- `source/spec/lib/utils/logging/LogContext_spec.js` — **new** — unit tests for `LogContext`
- `source/lib/background/Worker.js` — create `LogContext` and pass it to `job.perform()`
- `source/lib/jobs/ResourceRequestJob.js` — accept and use context; forward to `Client`
- `source/lib/jobs/AssetDownloadJob.js` — accept and use context; forward to `Client`
- `source/lib/jobs/ActionProcessingJob.js` — accept and use context; forward to `ResourceRequestAction`
- `source/lib/jobs/HtmlParseJob.js` — accept and use context; forward to `HtmlParser`
- `source/lib/services/Client.js` — accept context; replace `LogRegistry.*` calls
- `source/lib/models/ResourceRequestAction.js` — accept context; replace `LogRegistry.error`
- `source/lib/utils/HtmlParser.js` — accept context; replace `LogRegistry.warn`
- `source/lib/utils/HtmlElementParser.js` — accept context; replace `LogRegistry.warn`
- Specs for all of the above

## Notes

- `LogContext` must be a plain class (not a singleton/registry), so multiple contexts can coexist concurrently across workers.
- The `Logger.debug` calls in job classes (e.g. `ResourceRequestJob #${id} performing`) can also go through the context so they gain `workerId`/`jobId` in the buffer, even though they currently only go to the console.
- Log calls that are NOT in job context (`Engine`, `RouteRegister`, `WebServer`, `ConfigLoader`, `FailureChecker`, `EnvResolver`) stay as-is.
- Passing `logContext` via the `perform()` call (rather than the constructor) keeps jobs stateless and re-usable across retries by different workers — though injecting via constructor attributes is also viable if the job factory is updated accordingly.

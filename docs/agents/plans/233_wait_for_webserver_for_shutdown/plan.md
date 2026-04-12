# Plan: Wait for webServer for Shutdown

## Overview

Introduce a `PromiseAggregator` utility class that collects promises and exposes a single `wait()` method to await all of them. Update `Application#run()` to register both `engine.run()` and `webServer.run()` promises into the aggregator and `await` the aggregator instead of any single promise, ensuring the process only exits after all services finish.

## Context

Currently, `Application#run()` starts both the engine and the optional web server but does not coordinate their completion. The engine's promise resolves first and the process exits, leaving the web server's promise unresolved. The fix adds a lightweight aggregator so all registered service promises must resolve before the application returns.

## Implementation Steps

### Step 1 — Create `PromiseAggregator`

Create a new utility class `source/lib/utils/PromiseAggregator.js`:

- Holds an internal array of promises.
- `add(promise)` — pushes a promise into the array; silently ignores `null` and `undefined`.
- `async wait()` — waits for **all** registered promises to settle before returning. If one or more promises reject, it still waits for the remaining ones and then re-throws the first rejection error.

This class has no domain knowledge and belongs in `utils/`.

### Step 2 — Write specs for `PromiseAggregator`

Create `source/spec/lib/utils/PromiseAggregator_spec.js` covering:

- `add()` registers promises.
- `add(null)` and `add(undefined)` are silently ignored.
- `wait()` resolves only after all added promises resolve.
- `wait()` with no promises added resolves immediately.
- `wait()` waits for all promises to settle even when one rejects, then re-throws the first rejection.

### Step 3 — Update `Application#run()`

In `source/lib/services/Application.js`:

- Instantiate a `PromiseAggregator`.
- `add` the result of `engine.run()`.
- `add` the result of `webServer.run()` when the web server is present.
- `await aggregator.wait()` instead of awaiting either promise individually.

### Step 4 — Update `Application` specs

Update `source/spec/lib/services/Application_spec.js` to assert that `run()` does not resolve until both the engine and web server promises have resolved.

## Files to Change

- `source/lib/utils/PromiseAggregator.js` — new file: the aggregator utility class
- `source/spec/lib/utils/PromiseAggregator_spec.js` — new file: unit specs for the aggregator
- `source/lib/services/Application.js` — update `run()` to use `PromiseAggregator`
- `source/spec/lib/services/Application_spec.js` — update specs to cover coordinated shutdown

## Notes

- `wait()` should use `Promise.allSettled()` internally so it always waits for every promise to settle regardless of rejections, then inspect results and re-throw the first rejection error if any occurred.
- `add()` silently ignores `null` and `undefined`, so the call site (`Application`) can call `add(webServer?.run())` without an explicit null check.
- Both service promises are started before `wait()` is called, so awaiting them in sequence only affects detection of completion — actual concurrent execution is unaffected.

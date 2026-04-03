# Plan: Expose Queue Stats

## Overview

Add a `stats()` method to `JobRegistry` and `WorkersRegistry` that returns a plain object with counts for each internal state collection, enabling callers to observe system state without accessing private fields.

## Context

- `JobRegistry` already holds five private collections: `#enqueued` (Queue), `#failed` (Queue), `#processing` (IdentifyableCollection), `#finished` (IdentifyableCollection), `#dead` (IdentifyableCollection). All expose a `size()` method.
- `WorkersRegistry` holds two private `IdentifyableCollection` fields: `#idle` and `#busy`. Both expose `size()`.
- Both registries use constructor injection for their collections, so specs can inject known collections and assert counts directly.

## Implementation Steps

### Step 1 — Add `stats()` to `JobRegistry`

Add a public method returning an object with counts for all five job states:

```js
/**
 * Returns counts of jobs in each state.
 * @returns {{ enqueued: number, processing: number, failed: number, finished: number, dead: number }}
 */
stats() {
  return {
    enqueued:   this.#enqueued.size(),
    processing: this.#processing.size(),
    failed:     this.#failed.size(),
    finished:   this.#finished.size(),
    dead:       this.#dead.size(),
  };
}
```

### Step 2 — Write specs for `JobRegistry#stats()`

In `source/spec/registry/JobRegistry_spec.js`, add a `describe('#stats')` block. Use the injected collections to set up known state and assert the returned object matches.

Cover each field independently (e.g. enqueue a job → enqueued is 1; pick and finish → processing drops to 0, finished rises to 1; fail an exhausted job → dead rises to 1).

### Step 3 — Add `stats()` to `WorkersRegistry`

Add a public method returning idle and busy counts:

```js
/**
 * Returns counts of workers in each state.
 * @returns {{ idle: number, busy: number }}
 */
stats() {
  return {
    idle: this.#idle.size(),
    busy: this.#busy.size(),
  };
}
```

### Step 4 — Write specs for `WorkersRegistry#stats()`

In `source/spec/registry/WorkersRegistry_spec.js`, add a `describe('#stats')` block. Use the injected `idle` and `busy` collections to set up known state and assert the returned object.

Cover: all idle (initial state), one moved to busy (`setBusy`), one returned to idle (`setIdle`).

## Files to Change

- `source/lib/registry/JobRegistry.js` — add `stats()` method
- `source/lib/registry/WorkersRegistry.js` — add `stats()` method
- `source/spec/registry/JobRegistry_spec.js` — add specs for `#stats`
- `source/spec/registry/WorkersRegistry_spec.js` — add specs for `#stats`

## Notes

- No new dependencies needed; `size()` already exists on both `Queue` and `IdentifyableCollection`.
- The `unlock` / `lock` state is intentionally omitted from stats — it is an implementation detail, not a job-state metric.

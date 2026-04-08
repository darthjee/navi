# Plan: Queue a new ActionProcessingJob for each Action during ResourceRequest processing

## Overview

Replace the synchronous inline execution of actions inside `ResourceRequestJob` with an
async-friendly approach: after the HTTP request succeeds, one `ActionProcessingJob` is enqueued
per `(action, item)` pair. The responsibility for creating and enqueuing these jobs is
delegated to a new `ActionsEnqueuer` class — a rename/repurpose of the existing `ActionsExecutor`,
which retains the same structural role but now enqueues instead of executing inline.

Each `ActionProcessingJob` is exhausted after a single failure (no retry rights), matching the
TODO comment already present in `ActionsExecutor`.

## Context

### Current flow

```
ResourceRequestJob.perform()
  → Client.perform(resourceRequest)            # HTTP request
  → resourceRequest.executeActions(rawBody)    # delegates to ActionsExecutor
      → ResponseParser.parse(rawBody)
      → ActionsExecutor(actions, parsed).execute()
          → for each item × action: action.execute(item)  # logs; future: enqueues
```

### New flow

```
ResourceRequestJob.perform()
  → Client.perform(resourceRequest)            # HTTP request
  → resourceRequest.enqueueActions(rawBody, jobRegistry)  # delegates to ActionsEnqueuer
      → ResponseParser.parse(rawBody)
      → ActionsEnqueuer(actions, parsed, jobRegistry).enqueue()
          → for each item × action: jobRegistry.enqueueAction({ action, item })

ActionProcessingJob.perform()
  → action.execute(item)                       # logs today; future: enqueues ResourceRequestJob
```

The delegation pattern (`ResourceRequest` → class → loop) is preserved. Only the class name,
its dependency, and its inner loop behaviour change.

---

## Implementation Steps

### Step 1 — Create `ActionProcessingJob`

New file: `source/lib/models/ActionProcessingJob.js`

- Extends `Job`.
- Constructor: `{ id, action, item }`.
- `perform()`: calls `action.execute(item)` inside a try/catch; on error calls `_fail(error)`.
- Overrides `exhausted()` to return true after the **first** attempt — action jobs have no
  retry rights (per the existing TODO in `ActionsExecutor`).

```js
async perform() {
  try {
    this.lastError = undefined;
    action.execute(item);
  } catch (error) {
    this._fail(error);
  }
}
```

> Note: `exhausted()` override requires reading the attempt count from `Job`.
> Add a protected `get _attempts()` getter to `Job` so subclasses can read it.

### Step 2 — Create `ActionsEnqueuer`

New file: `source/lib/models/ActionsEnqueuer.js`

Mirrors the structure of `ActionsExecutor` but enqueues jobs instead of executing actions.

- Constructor: `(actions, parsed, jobRegistry)`.
- `enqueue()`:
  - Throws `NullResponse` if `parsed === null`.
  - Normalizes `parsed` to an items array.
  - For each `item` × `action`: calls `jobRegistry.enqueueAction({ action, item })`.

```js
enqueue() {
  if (this.#parsed === null) throw new NullResponse();

  const items = Array.isArray(this.#parsed) ? this.#parsed : [this.#parsed];
  for (const item of items) {
    for (const action of this.#actions) {
      this.#jobRegistry.enqueueAction({ action, item });
    }
  }
}
```

### Step 3 — Add `enqueueActions` to `ResourceRequest`

`source/lib/models/ResourceRequest.js`:

Add a new method alongside (or replacing) `executeActions`:

```js
enqueueActions(rawBody, jobRegistry) {
  if (this.actions.length === 0) return;

  const parsed = new ResponseParser(rawBody).parse();
  new ActionsEnqueuer(this.actions, parsed, jobRegistry).enqueue();
}
```

`executeActions` is kept unchanged for now and deprecated — removal is a follow-up.

### Step 4 — Modify `ResourceRequestJob`

`source/lib/models/ResourceRequestJob.js`:

- Add `jobRegistry` to constructor params.
- Replace `this.#resourceRequest.executeActions(response.data)` with:
  ```js
  this.#resourceRequest.enqueueActions(response.data, this.#jobRegistry);
  ```

### Step 5 — Add `enqueueAction` to `JobRegistry`

`source/lib/registry/JobRegistry.js`:

- Add `actionFactory` constructor parameter (default: `new JobFactory({ klass: ActionProcessingJob })`).
- Add method `enqueueAction({ action, item })`:
  ```js
  enqueueAction({ action, item }) {
    const job = this.#actionFactory.build({ action, item });
    this.#enqueued.push(job);
    return job;
  }
  ```

### Step 6 — Wire `jobRegistry` into `ResourceRequestJob` via `JobFactory`

`source/lib/registry/JobRegistry.js`:

In the default factory construction, pass `jobRegistry: this` in the attributes so every
`ResourceRequestJob` built by the registry receives the registry reference automatically:

```js
this.#factory = factory || new JobFactory({
  attributes: { clients, jobRegistry: this }
});
```

`Application` does not need to change.

---

## Files to Change

| File | Change |
|------|--------|
| `source/lib/models/ActionProcessingJob.js` | **New** — job class for a single `(action, item)` pair |
| `source/lib/models/ActionsEnqueuer.js` | **New** — enqueues action jobs; mirrors `ActionsExecutor` structure |
| `source/lib/models/Job.js` | Add protected `get _attempts()` getter |
| `source/lib/models/ResourceRequest.js` | Add `enqueueActions(rawBody, jobRegistry)` method |
| `source/lib/models/ResourceRequestJob.js` | Add `jobRegistry`; call `enqueueActions` instead of `executeActions` |
| `source/lib/registry/JobRegistry.js` | Add `actionFactory`; add `enqueueAction()`; pass `jobRegistry: this` to default factory |
| `source/spec/lib/models/ActionProcessingJob_spec.js` | **New** |
| `source/spec/lib/models/ActionsEnqueuer_spec.js` | **New** |
| `source/spec/lib/models/Job_spec.js` | Add test for `_attempts` getter |
| `source/spec/lib/models/ResourceRequest_spec.js` | Add tests for `enqueueActions` |
| `source/spec/lib/models/ResourceRequestJob_spec.js` | Pass `jobRegistry`; assert `enqueueActions` called instead of `executeActions` |
| `source/spec/lib/registry/JobRegistry_spec.js` | Add tests for `enqueueAction` |

## CI Checks

Before opening a PR, run inside the `navi_app` container:
- `cd source; yarn test` (CircleCI job: `jasmine`)
- `cd source; yarn lint` (CircleCI job: `checks`)

## Notes

- `ActionsExecutor` and `ResourceRequest.executeActions()` are **not deleted** in this PR —
  they remain unchanged and unused after this change. Removal is a follow-up.
- `ActionProcessingJob.perform()` still calls `action.execute(item)` which only logs today.
  Changing it to enqueue new `ResourceRequestJob`s is a separate issue.
- `Application` does not need to change — `JobRegistry` wires itself.

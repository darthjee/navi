# Plan: Queue a new ActionProcessingJob for each Action during ResourceRequest processing

## Overview

Replace the synchronous inline execution of actions inside `ResourceRequestJob` with an
async-friendly approach: after the HTTP request succeeds, one `ActionProcessingJob` is enqueued
per `(action, item)` pair. Each `ActionProcessingJob` is exhausted after a single failure (no
retry rights), matching the TODO comment already present in `ActionsExecutor`.

## Context

### Current flow

```
ResourceRequestJob.perform()
  → Client.perform(resourceRequest)          # HTTP request
  → resourceRequest.executeActions(rawBody)  # synchronous, inline
      → ResponseParser.parse(rawBody)
      → ActionsExecutor.execute()
          → for each item × action: action.execute(item)  # logs today; future: enqueues
```

### New flow

```
ResourceRequestJob.perform()
  → Client.perform(resourceRequest)          # HTTP request
  → parse rawBody → normalize to items
  → for each item × action:
      jobRegistry.enqueueAction({ action, item })

ActionProcessingJob.perform()
  → action.execute(item)                     # logs today; future: enqueues ResourceRequestJob
```

The `ActionsExecutor` and `ResourceRequest.executeActions()` are no longer called from
`ResourceRequestJob`. They may be removed in a follow-up once `ActionProcessingJob` is extended
to actually enqueue new resource jobs.

---

## Implementation Steps

### Step 1 — Create `ActionProcessingJob`

New file: `source/lib/models/ActionProcessingJob.js`

- Extends `Job`.
- Constructor: `{ id, action, item }`.
- `perform()`: calls `action.execute(item)` inside a try/catch; on error calls `_fail(error)`.
- Overrides `exhausted()` to return true after the **first** attempt (`this.attempts >= 1`) —
  action jobs have no retry rights per the existing TODO in `ActionsExecutor`.

```js
async perform() {
  try {
    this.lastError = undefined;
    await action.execute(item);
  } catch (error) {
    this._fail(error);
  }
}
```

> Note: `exhausted()` override requires exposing `#attempts` or a protected getter in `Job`.
> Add a protected `get _attempts()` getter to `Job` so subclasses can read the count without
> breaking encapsulation.

### Step 2 — Add `enqueueAction` to `JobRegistry`

`source/lib/registry/JobRegistry.js`:

- Add an `actionFactory` constructor parameter (default: `new JobFactory({ klass: ActionProcessingJob })`).
- Add method `enqueueAction({ action, item })` that builds an `ActionProcessingJob` via
  `actionFactory` and pushes it to the enqueued queue.

```js
enqueueAction({ action, item }) {
  const job = this.#actionFactory.build({ action, item });
  this.#enqueued.push(job);
  return job;
}
```

### Step 3 — Modify `ResourceRequestJob`

`source/lib/models/ResourceRequestJob.js`:

- Add `jobRegistry` to constructor params.
- Replace the call to `this.#resourceRequest.executeActions(response.data)` with a new private
  method `#enqueueActions(rawBody)`:

```js
#enqueueActions(rawBody) {
  if (this.#resourceRequest.actions.length === 0) return;

  const parsed = new ResponseParser(rawBody).parse();
  if (parsed === null) throw new NullResponse();

  const items = Array.isArray(parsed) ? parsed : [parsed];
  for (const item of items) {
    for (const action of this.#resourceRequest.actions) {
      this.#jobRegistry.enqueueAction({ action, item });
    }
  }
}
```

`ResourceRequestJob` needs to import `ResponseParser` and `NullResponse` directly.

### Step 4 — Wire `jobRegistry` into `ResourceRequestJob` via `JobFactory`

`source/lib/registry/JobRegistry.js`:

In the default factory construction, pass `jobRegistry: this` in the attributes:

```js
this.#factory = factory || new JobFactory({
  attributes: { clients, jobRegistry: this }
});
```

This ensures every `ResourceRequestJob` created by `JobRegistry` receives the registry reference
without requiring changes to `Application`.

---

## Files to Change

| File | Change |
|------|--------|
| `source/lib/models/ActionProcessingJob.js` | **New** — job class for a single action+item |
| `source/lib/models/Job.js` | Add protected `get _attempts()` getter |
| `source/lib/models/ResourceRequestJob.js` | Add `jobRegistry`; replace `executeActions` with `#enqueueActions` |
| `source/lib/registry/JobRegistry.js` | Add `actionFactory`; add `enqueueAction()`; pass `jobRegistry: this` to default factory |
| `source/spec/lib/models/ActionProcessingJob_spec.js` | **New** — spec for `ActionProcessingJob` |
| `source/spec/lib/models/Job_spec.js` | Add test for `_attempts` getter |
| `source/spec/lib/models/ResourceRequestJob_spec.js` | Update to pass `jobRegistry`; assert `enqueueAction` called instead of `executeActions` |
| `source/spec/lib/registry/JobRegistry_spec.js` | Add tests for `enqueueAction` |

## CI Checks

Before opening a PR, run inside the `navi_app` container:
- `cd source; yarn test` (CircleCI job: `jasmine`)
- `cd source; yarn lint` (CircleCI job: `checks`)

## Notes

- `ResourceRequest.executeActions()` and `ActionsExecutor` are not deleted in this PR —
  they are simply no longer called from `ResourceRequestJob`. Removal is a follow-up.
- `ActionProcessingJob.perform()` still calls `action.execute(item)` which only logs today.
  Changing it to enqueue new `ResourceRequestJob`s (the ultimate goal from the TODOs) is a
  separate issue.
- `Application` does not need to change — `JobRegistry` wires itself.

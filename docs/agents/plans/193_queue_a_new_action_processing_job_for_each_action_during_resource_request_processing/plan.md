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

### Factory registry pattern

`JobFactory` now maintains a static registry (`JobFactory.build`, `JobFactory.get`, `JobFactory.reset`).
`Application.#initRegistries` already registers the `'ResourceRequestJob'` factory, and
`JobRegistry` retrieves it via `JobFactory.get('ResourceRequestJob')`.

The same pattern is extended here: a factory named `'Action'` is registered in `Application`
and retrieved in `JobRegistry.enqueueAction`.

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

`jobRegistry` is **not** baked into the factory attributes. It is passed at build time by
`JobRegistry.enqueue` (see Step 5), keeping `Application` unchanged.

### Step 5 — Update `JobRegistry`

`source/lib/registry/JobRegistry.js`:

#### 5a — Pass `jobRegistry: this` in `enqueue`

Update `enqueue` to inject the registry reference at build time, so every
`ResourceRequestJob` receives it without changing the factory:

```js
enqueue({ resourceRequest, parameters } = {}) {
  const job = this.#factory.build({ resourceRequest, parameters, jobRegistry: this });
  this.#enqueued.push(job);
  return job;
}
```

#### 5b — Add `enqueueAction` method

Uses `JobFactory.get('Action')` (registered by `Application`) to build action jobs:

```js
enqueueAction({ action, item }) {
  const job = JobFactory.get('Action').build({ action, item });
  this.#enqueued.push(job);
  return job;
}
```

No new constructor parameter is needed — the 'Action' factory is retrieved from the static
registry just as `JobFactory.get('ResourceRequestJob')` is used today.

### Step 6 — Register the `'Action'` factory in `Application`

`source/lib/services/Application.js` — `#initRegistries`:

```js
#initRegistries({ jobRegistry, workersRegistry } = {}) {
  JobFactory.build('ResourceRequestJob', { attributes: { clients: this.config.clientRegistry } });
  JobFactory.build('Action', { klass: ActionProcessingJob });

  this.jobRegistry = jobRegistry || new JobRegistry({
    cooldown: this.config.workersConfig.retryCooldown,
  });
  // ...
}
```

`JobFactory.build('Action', { klass: ActionProcessingJob })` registers the factory under
the name `'Action'` with no extra attributes — action jobs only need `{ action, item }` which
are passed at build time by `enqueueAction`.

---

## Files to Change

| File | Change |
|------|--------|
| `source/lib/models/ActionProcessingJob.js` | **New** — job class for a single `(action, item)` pair |
| `source/lib/models/ActionsEnqueuer.js` | **New** — enqueues action jobs; mirrors `ActionsExecutor` structure |
| `source/lib/models/Job.js` | Add protected `get _attempts()` getter |
| `source/lib/models/ResourceRequest.js` | Add `enqueueActions(rawBody, jobRegistry)` method |
| `source/lib/models/ResourceRequestJob.js` | Add `jobRegistry` constructor param; call `enqueueActions` instead of `executeActions` |
| `source/lib/registry/JobRegistry.js` | Pass `jobRegistry: this` in `enqueue`; add `enqueueAction()` using `JobFactory.get('Action')` |
| `source/lib/services/Application.js` | Register `'Action'` factory in `#initRegistries` |
| `source/spec/lib/models/ActionProcessingJob_spec.js` | **New** |
| `source/spec/lib/models/ActionsEnqueuer_spec.js` | **New** |
| `source/spec/lib/models/Job_spec.js` | Add test for `_attempts` getter |
| `source/spec/lib/models/ResourceRequest_spec.js` | Add tests for `enqueueActions` |
| `source/spec/lib/models/ResourceRequestJob_spec.js` | Pass `jobRegistry`; assert `enqueueActions` called instead of `executeActions` |
| `source/spec/lib/registry/JobRegistry_spec.js` | Assert `jobRegistry: this` passed in `enqueue`; add tests for `enqueueAction` |
| `source/spec/lib/services/Application_spec.js` | Assert `'Action'` factory registered in `#initRegistries` |

## CI Checks

Before opening a PR, run inside the `navi_app` container:
- `cd source; yarn test` (CircleCI job: `jasmine`)
- `cd source; yarn lint` (CircleCI job: `checks`)

## Notes

- `ActionsExecutor` and `ResourceRequest.executeActions()` are **not deleted** in this PR —
  they remain unchanged and unused after this change. Removal is a follow-up.
- `ActionProcessingJob.perform()` still calls `action.execute(item)` which only logs today.
  Changing it to enqueue new `ResourceRequestJob`s is a separate issue.
- `Application` registration order: both factories are registered before `new JobRegistry()`
  is called, so `JobFactory.get('ResourceRequestJob')` inside `JobRegistry`'s constructor
  already resolves. The `'Action'` factory is available before any job runs.
- `jobRegistry` is passed to `ResourceRequestJob` at **build time** (`jobRegistry: this` inside
  `JobRegistry.enqueue`), not baked into factory attributes. This avoids a chicken-and-egg
  problem between the factory and the registry.

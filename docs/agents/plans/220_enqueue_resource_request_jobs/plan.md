# Plan: ResourceRequestAction enqueue ResourceRequest jobs

## Overview

Complete the TODO in `ResourceRequestAction.execute()` so that, instead of logging,
it enqueues a new `ResourceRequestJob` for the named resource with the mapped variables
as job parameters. This enables cascading resource requests driven by YAML config.

## Context

`ResourceRequestAction` already holds a `resource` name and a `VariablesMapper`.
The full dependency chain (`jobRegistry` and `resourceRegistry`) is available at the point
where actions are executed, but it is not yet threaded through. This plan wires it up
end-to-end and updates the architecture documentation to reflect the changes.

## Implementation Steps

### Step 1 — Update `ResourceRequestAction.execute()`

Change the signature from `execute(item)` to `execute(item, jobRegistry, resourceRegistry)`.

Replace the `Logger.info(...)` call with:

1. Map the item to variables: `const vars = this.#mapper.map(item)`
2. Look up the resource: `const resource = resourceRegistry.getItem(this.resource)`
3. For each `ResourceRequest` in `resource.resourceRequests`, call:
   `jobRegistry.enqueue('ResourceRequest', { resourceRequest, parameters: vars, jobRegistry })`

Remove the TODO comment and update JSDoc.

### Step 2 — Update `ActionProcessingJob`

Add `resourceRegistry` as a stored constructor parameter alongside `jobRegistry`.

Update `perform()` to pass both registries to `action.execute()`:

```js
async perform() {
  this.#action.execute(this.#item, this.#jobRegistry, this.#resourceRegistry);
}
```

Update JSDoc.

### Step 3 — Update `ActionEnqueuer`

`ActionEnqueuer` is the class that calls `JobRegistry.enqueueAction(...)`. It must accept and
forward `resourceRegistry` when building `ActionProcessingJob` instances.

Update its constructor to receive `resourceRegistry` and pass it through when enqueueing.

### Step 4 — Update `ActionsEnqueuer`

`ActionsEnqueuer` creates `ActionEnqueuer` instances. It must accept `resourceRegistry` and
forward it to each `ActionEnqueuer`.

### Step 5 — Update `ResourceRequest.enqueueActions()`

`ResourceRequest.enqueueActions(rawBody, jobRegistry)` creates the `ActionsEnqueuer`.
It must accept `resourceRegistry` and pass it to `ActionsEnqueuer`.

### Step 6 — Update `ResourceRequestJob.perform()`

`ResourceRequestJob` calls `resourceRequest.enqueueActions(rawBody, jobRegistry)`.
It must also pass `resourceRegistry` — which it already receives at build time — to this call.

### Step 7 — Update `JobRegistry.enqueueAction()`

Update `enqueueAction({ action, item, resourceRegistry })` to accept and forward `resourceRegistry`
to the `ActionProcessingJob` factory.

### Step 8 — Update `docs/agents/architecture.md`

Update the table entries for the affected classes (`ResourceRequestAction`, `ActionProcessingJob`,
`ActionsEnqueuer`, `ActionEnqueuer`, `ResourceRequestJob`) to reflect their new signatures and
responsibilities.

## Files to Change

### Source

- `source/lib/models/ResourceRequestAction.js` — implement job enqueuing; update `execute()` signature and JSDoc; remove TODO
- `source/lib/models/ActionProcessingJob.js` — add `resourceRegistry` to constructor and `perform()`; update JSDoc
- `source/lib/models/ActionEnqueuer.js` — accept and forward `resourceRegistry`; update JSDoc
- `source/lib/models/ActionsEnqueuer.js` — accept and forward `resourceRegistry`; update JSDoc
- `source/lib/models/ResourceRequest.js` — accept and forward `resourceRegistry` in `enqueueActions()`; update JSDoc
- `source/lib/models/ResourceRequestJob.js` — pass `resourceRegistry` to `enqueueActions()`; update JSDoc
- `source/lib/registry/JobRegistry.js` — update `enqueueAction()` to accept and forward `resourceRegistry`; update JSDoc

### Specs

- `source/spec/lib/models/ResourceRequestAction_spec.js` — add tests for job enqueuing; cover `ResourceNotFound` and `MissingMappingVariable`
- `source/spec/lib/models/ActionProcessingJob_spec.js` — update tests to verify `resourceRegistry` is passed to `action.execute()`
- `source/spec/lib/models/ActionEnqueuer_spec.js` — update tests to verify `resourceRegistry` forwarding
- `source/spec/lib/models/ActionsEnqueuer_spec.js` — update tests to verify `resourceRegistry` forwarding
- `source/spec/lib/models/ResourceRequest_spec.js` — update tests to verify `resourceRegistry` forwarding in `enqueueActions()`
- `source/spec/lib/models/ResourceRequestJob_spec.js` — update tests to verify `resourceRegistry` is passed to `enqueueActions()`
- `source/spec/lib/registry/JobRegistry_spec.js` — update tests for `enqueueAction()` to include `resourceRegistry`

### Docs

- `docs/agents/architecture.md` — update class descriptions for all modified classes

## Notes

- Dependency injection happens at runtime (passed into `execute()`) because actions are built
  from YAML config before `JobRegistry` exists. No constructor changes to `ResourceRequestAction`.
- One `ResourceRequestJob` is enqueued per `ResourceRequest` in the target resource, enabling
  parallel processing and independent retry logic.
- This is a non-breaking change for YAML configs: existing configs without actions continue to
  work unchanged. Configs with actions will now actually enqueue jobs instead of just logging.
- The existing `ActionsExecutor` (legacy) is not touched by this plan.

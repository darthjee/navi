# Plan: ResourceRequestAction enqueue ResourceRequest jobs

## Overview

Complete the TODO in `ResourceRequestAction.execute()` so that, instead of logging,
it enqueues a new `ResourceRequestJob` for the named resource with the mapped variables
as job parameters. This enables cascading resource requests driven by YAML config.

## Context

`ResourceRequestAction` already holds a `resource` name and a `VariablesMapper`.
Both `JobRegistry` and `ResourceRegistry` are static singletons, so `execute()` can
call them directly without any parameter threading through the call chain.

## Implementation Steps

### Step 1 — Update `ResourceRequestAction.execute()`

Keep the signature as `execute(item)` (no extra parameters needed — registries are static singletons).

Replace the `Logger.info(...)` call with:

1. Map the item to variables: `const vars = this.#mapper.map(item)`
2. Look up the resource: `const resource = ResourceRegistry.getItem(this.resource)`
3. For each `ResourceRequest` in `resource.resourceRequests`, call:
   `JobRegistry.enqueue('ResourceRequestJob', { resourceRequest, parameters: vars })`

Remove the TODO comment and update JSDoc.

### ~~Steps 2–7 — Threading registries through the call chain~~

**Not needed.** The original plan assumed `jobRegistry` and `resourceRegistry` needed to be
passed as parameters through `ActionProcessingJob`, `ActionEnqueuer`, `ActionsEnqueuer`,
`ResourceRequest`, `ResourceRequestJob`, and `JobRegistry.enqueueAction()`. Since both
registries are static singletons, `execute()` accesses them directly and the call chain
remains unchanged.

### Step 8 — Update `docs/agents/architecture.md`

Update the `ResourceRequestAction` table entry to reflect the new behaviour.

## Files Changed

### Source

- `source/lib/models/ResourceRequestAction.js` — implement job enqueuing via static `ResourceRegistry` and `JobRegistry`; remove TODO and Logger import for execute; update JSDoc

### Specs

- `source/spec/lib/models/ResourceRequestAction_spec.js` — rewrite `#execute` tests: verify job enqueuing, multiple ResourceRequests, `ResourceNotFound`, `MissingMappingVariable`

### Docs

- `docs/agents/architecture.md` — update `ResourceRequestAction` description

## Notes

- Both `JobRegistry` and `ResourceRegistry` are static singletons, so no parameter threading
  is needed through the action-processing chain.
- One `ResourceRequestJob` is enqueued per `ResourceRequest` in the target resource, enabling
  parallel processing and independent retry logic.
- This is a non-breaking change for YAML configs: existing configs without actions continue to
  work unchanged. Configs with actions will now actually enqueue jobs instead of just logging.
- The existing `ActionsExecutor` (legacy) is not touched by this plan.

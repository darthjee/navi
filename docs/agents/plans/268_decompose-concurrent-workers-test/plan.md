# Plan: Decompose the concurrent-workers test in Engine_spec.js into focused cases

## Overview

Refactor the "when jobs take some time to be processed" `describe` block in `Engine_spec.js`
to improve clarity and separation of concerns. Extract the complex `WorkersRegistry` spy into
a named helper function, split the single monolithic `beforeEach` into smaller focused blocks,
and split the single `it` into multiple focused test cases. Optionally introduce a
`DummyWorkersAllocatorFactory` to avoid repeating allocator construction in future tests.

## Context

The describe block "when jobs take some time to be processed" (around line 118 of
`Engine_spec.js`) has a single `beforeEach` that:

1. Rebuilds `WorkersRegistry` with a custom workers collection.
2. Creates a `DummyWorkersAllocator`.
3. Creates a new `Engine`.
4. Sets a job-success-rate variable.
5. Installs a complex multi-step spy on `WorkersRegistry`.

All five responsibilities are packed into one setup block, making it very hard to understand
what is actually being tested versus what is scaffolding. When this test fails, it is nearly
impossible to tell which part of the setup is wrong.

## Implementation Steps

### Step 1 — Extract the WorkersRegistry spy into a named helper

Define a top-level named function (e.g., `stubWorkersRegistryIdleCheck`) that installs the
multi-step spy on `WorkersRegistry.hasIdleWorker`. Moving it out of the `beforeEach` makes
the spy's intent explicit and allows it to be reused in other describe blocks in the future.

### Step 2 — Split the large beforeEach into focused nested blocks

Break the single `beforeEach` into smaller blocks, each responsible for one concern:
- Registry rebuild (`WorkersRegistry.reset` + `WorkersRegistry.build` + `initWorkers`) in one block.
- Allocator and engine creation in a nested block.
- Success rate and job enqueueing in a further nested block (or per `it` block).

This way, each `beforeEach` only sets up what its sibling `it` blocks actually need.

### Step 3 — Split the single it into focused test cases

Separate assertions into individual `it` blocks, each testing one behaviour:
- All jobs are eventually finished or dead.
- Workers are actually used concurrently (idle-worker transitions happen as expected).
- Any additional behaviours surfaced during refactoring.

### Step 4 — (Optional) Introduce DummyWorkersAllocatorFactory

Add `source/spec/support/dummies/services/DummyWorkersAllocatorFactory.js`, a factory helper
that constructs a `DummyWorkersAllocator` with a given config. This avoids ad-hoc
`new DummyWorkersAllocator()` calls scattered across tests and makes future tests easier to
write consistently.

## Files to Change

- `source/spec/lib/services/Engine_spec.js` — main refactor: extract spy helper, split
  `beforeEach`, split `it` blocks.
- `source/spec/support/dummies/services/DummyWorkersAllocatorFactory.js` — *(optional, new
  file)* factory helper for `DummyWorkersAllocator`.

## Notes

- No production code changes are required; this is a test-only refactor.
- The observable behaviour of the test suite must remain identical after the refactor.
- The optional `DummyWorkersAllocatorFactory` should only be introduced if it simplifies the
  spec meaningfully; do not add it just for the sake of it.

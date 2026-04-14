# Plan: Consolidate duplicate beforeEach/afterEach in ActionEnqueuer/ActionsEnqueuer specs

## Overview

Extract the shared `JobRegistry` and `action` spy setup from `ActionEnqueuer_spec.js`
and `ActionsEnqueuer_spec.js` into a reusable helper, replacing the duplicated
`beforeEach`/`afterEach` blocks with a single call.

## Context

Both spec files repeat the same setup block:

```js
beforeEach(() => {
  action = jasmine.createSpyObj('action', ['execute']);
  JobRegistry.build({ cooldown: -1 });
  spyOn(JobRegistry, 'enqueue').and.stub();
});
afterEach(() => {
  JobRegistry.reset();
});
```

The repeated boilerplate obscures what each spec is actually testing differently.

## Implementation Steps

### Step 1 — Inspect the two spec files

Read `ActionEnqueuer_spec.js` and `ActionsEnqueuer_spec.js` to confirm which parts
of the setup are identical and which are specific to each file.

### Step 2 — Create `spec/support/utils/ActionEnqueuerUtils.js`

Following the existing convention (`JobRegistryUtils`, `LoggerUtils`, `AxiosUtils` live
in `spec/support/utils/`), create a new `ActionEnqueuerUtils` class with a static
`setup()` method that:
- Creates `action = jasmine.createSpyObj('action', ['execute'])` in `beforeEach`.
- Calls `JobRegistry.build({ cooldown: -1 })` in `beforeEach`.
- Installs `spyOn(JobRegistry, 'enqueue').and.stub()` in `beforeEach`.
- Calls `JobRegistry.reset()` in `afterEach`.
- Returns a context object with the `action` reference so specs can use it in assertions.

### Step 3 — Update the two spec files

In each file, remove the duplicated `beforeEach`/`afterEach` block and replace it with
a single call to `ActionEnqueuerUtils.setup()`, storing the returned context for access
to `action`. Add the import at the top following existing import order conventions.

## Files to Change

- `source/spec/support/utils/ActionEnqueuerUtils.js` — *(new file)* shared setup helper
- `source/spec/lib/models/ActionEnqueuer_spec.js`
- `source/spec/lib/models/ActionsEnqueuer_spec.js`

## Notes

- No production code changes are required; this is a test-only refactor.
- The observable behaviour of the test suite must remain identical after the refactor.

# Plan: Deduplicate JobRegistry setup across 8 spec files

## Overview

Extract the repeated `beforeEach`/`afterEach` `JobRegistry` setup into a shared helper and
replace the 8 duplicated blocks with a single import and invocation of that helper.

## Context

Eight `JobRegistry` spec files each repeat nearly identical setup blocks that build a
`JobRegistry` with `Queue`, `IdentifyableCollection`, and cooldown, and reset it in
`afterEach`. Any change to the registry setup must be replicated in all 8 places,
violating DRY and making maintenance error-prone.

## Implementation Steps

### Step 1 — Inspect the 8 spec files for setup variations

Read all 8 affected files to determine whether the `beforeEach`/`afterEach` blocks are
truly identical or contain variations (e.g. different queue variable names, different
cooldown values, extra options). This informs whether a single zero-config helper suffices
or whether the helper needs optional parameters.

### Step 2 — Create `spec/support/utils/JobRegistryUtils.js`

Following the existing convention (`AxiosUtils`, `LoggerUtils` live in `spec/support/utils/`),
create a new `JobRegistryUtils` class that exports a static method
`setupJobRegistry(options = {})`. This method:
- Creates the required collections (`Queue`, `IdentifyableCollection`) for the registry.
- Installs a `beforeEach` that calls `JobRegistry.build(...)` with the configured options.
- Installs an `afterEach` that calls `JobRegistry.reset()`.
- Returns (or exposes via a passed-in object) references to the collections so individual
  specs can use them in assertions.

### Step 3 — Update the 8 spec files

In each file, remove the duplicated `beforeEach`/`afterEach` setup block and replace it
with a single call to `JobRegistryUtils.setupJobRegistry(...)`, adding the import at the
top of the file following the existing import order conventions.

## Files to Change

- `source/spec/support/utils/JobRegistryUtils.js` — *(new file)* shared setup helper
- `source/spec/lib/registry/JobRegistry_enqueue_spec.js`
- `source/spec/lib/registry/JobRegistry_fail_spec.js`
- `source/spec/lib/registry/JobRegistry_finish_spec.js`
- `source/spec/lib/registry/JobRegistry_pick_spec.js`
- `source/spec/lib/registry/JobRegistry_requeue_spec.js`
- `source/spec/lib/registry/JobRegistry_promoteReadyJobs_spec.js`
- `source/spec/lib/registry/JobRegistry_hasJob_spec.js`
- `source/spec/lib/registry/JobRegistry_hasReadyJob_spec.js`

## Notes

- No production code changes are required; this is a test-only refactor.
- The observable behaviour of the test suite must remain identical after the refactor.
- The helper lives in `spec/support/utils/` (not a new `contexts/` folder) to stay
  consistent with `AxiosUtils` and `LoggerUtils`.
- If any spec file uses a non-standard cooldown or extra options, those should be passed as
  arguments to `setupJobRegistry()` rather than forcing the helper to be less generic.

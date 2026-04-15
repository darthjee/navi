# Plan: dev/app/spec: DataNavigator_spec uses manual repetitive patterns instead of data-driven tests

## Overview

Refactor `dev/app/spec/lib/DataNavigator_spec.js` to replace the 8 manually written `describe`/`it` blocks with a data-driven loop over a table of `{ steps, expected }` pairs. The custom-`idField` tests remain as a separate `describe` block.

## Context

The spec currently has 4 `describe` blocks, each containing 2 `it` blocks, all following the same structure: instantiate a `DataNavigator`, call `navigate()`, and assert the result. The only difference between cases is the `steps` array and the expected value. This pattern is ideal for a data-driven table.

## Implementation Steps

### Step 1 — Identify all repetitive cases

Read the current `DataNavigator_spec.js` to catalogue each `{ steps, expected }` pair from the repetitive blocks, and identify the custom-`idField` tests that should remain separate.

### Step 2 — Replace repetitive blocks with a data-driven loop

Remove the 4 repetitive `describe` blocks and replace them with:
1. A `cases` array of `{ label, steps, expected }` objects.
2. A `cases.forEach(...)` loop that generates one `it` per entry.

Use a descriptive label per case (e.g. `navigate(['categories']) returns the categories array`) so test output remains readable.

### Step 3 — Preserve the custom-idField block

Keep the `describe` block that tests custom `idField` behaviour unchanged, as it uses different data and a different instantiation pattern.

### Step 4 — Verify lint and tests

Run inside the Docker container:
```bash
yarn lint
npx jasmine spec/lib/DataNavigator_spec.js
```

## Files to Change

- `dev/app/spec/lib/DataNavigator_spec.js` — replace repetitive `describe`/`it` blocks with a data-driven `cases` loop; preserve `idField` block

## Notes

- No production code changes — this is a pure test refactor.
- The number of executed tests should remain the same after the refactor.
- Use `() => ...` thunks for `expected` values that reference `data` to avoid hoisting issues if needed.

## CI Checks

Before opening a PR, run the following checks for the folders being modified:

- `dev/`: `yarn lint` and `yarn spec` (CircleCI job: `dev-app-tests`)

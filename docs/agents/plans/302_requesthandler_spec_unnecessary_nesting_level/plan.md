# Plan: dev/app/spec: RequestHandler_spec has an unnecessary nesting level (#handle)

## Overview

Remove the redundant `describe('#handle')` wrapper from `dev/app/spec/lib/RequestHandler_spec.js` and flatten its contents directly under `describe('RequestHandler')`, embedding the method name into each inner describe label.

## Context

The spec file currently has two levels of nesting before reaching any test logic:

```js
describe('RequestHandler', () => {
  describe('#handle', () => {            // ← redundant wrapper
    describe('without a serializer', () => {
      it('...', ...)
    });
  });
});
```

Since `handle` is the only method tested in this file, the `#handle` wrapper adds indentation without adding structure. The fix is to collapse it by promoting its children one level up and prefixing each inner `describe` label with `#handle — `.

## Implementation Steps

### Step 1 — Remove the `#handle` wrapper

Remove the `describe('#handle', () => { ... })` block, keeping its body intact but dedented by one level.

### Step 2 — Rename each inner describe

Prefix every direct child `describe` label with `#handle — ` to preserve method attribution in test output. For example:

- `'without a serializer'` → `'#handle — without a serializer'`
- `'when a URL param is non-numeric'` → `'#handle — when a URL param is non-numeric'`

### Step 3 — Verify indentation and style

Ensure the resulting file uses 2-space indentation consistently and passes ESLint (`yarn lint`).

### Step 4 — Run the spec

Run the affected spec file inside the Docker container to confirm all tests still pass:

```bash
npx jasmine spec/lib/RequestHandler_spec.js
```

## Files to Change

- `dev/app/spec/lib/RequestHandler_spec.js` — remove `describe('#handle')` wrapper; promote and relabel inner describes

## Notes

- No logic changes — this is a pure structural refactor of the test file.
- If a second method (`#someOtherMethod`) is ever added to this spec, a method-level `describe` wrapper should be introduced at that time.

## CI Checks

Before opening a PR, run the following checks for the folders being modified:

- `dev/`: `yarn lint` and `yarn spec` (CircleCI job: `dev-app-tests`)

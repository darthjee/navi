# Issue: dev/app/spec: RequestHandler_spec has an unnecessary nesting level (#handle)

## Description

All tests in `spec/lib/RequestHandler_spec.js` are nested under `describe('#handle')`, which is itself nested under `describe('RequestHandler')`. This creates an extra level of indentation for every single test in the file and adds no structural value since `handle` is the only method being tested.

## Problem

- All 6 `describe` blocks and all `it` blocks are indented one level deeper than necessary.
- Test output and file navigation are harder to scan.
- Adding tests for a future second method would require restructuring anyway.
- The `#handle` wrapper has no structural value when it is the only method being tested.

## Expected Behavior

- The `#handle` describe blocks should sit directly under `describe('RequestHandler')`, using inline labels like `#handle — without a serializer`.
- Test output and file navigation should be easier to read without the extra indentation level.

## Solution

Move the `#handle` describe blocks up one level, directly under `describe('RequestHandler')`:

```js
describe('RequestHandler', () => {
  describe('#handle — without a serializer', () => { ... });
  describe('#handle — when a URL param is non-numeric', () => { ... });
  // ...
});
```

Keep the `#handle` wrapper only if a second method spec is added at the same time.

## Benefits

- Reduces unnecessary nesting, making tests easier to scan.
- Cleaner test output.
- Avoids requiring restructuring when a second method is eventually tested.

## Affected Files

- `dev/app/spec/lib/RequestHandler_spec.js`

---
See issue for details: https://github.com/darthjee/navi/issues/302

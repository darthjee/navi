# Issue: Refactor PromiseAggregator to Wait for New Promises

## Description
`PromiseAggregator.wait()` currently calls `Promise.allSettled` once on the snapshot of promises at call time. Any promise added after `wait()` starts is silently missed. The method needs to be refactored into a loop that continuously drains settled promises until none remain.

## Problem
- `wait()` captures the promise list once and never rechecks it
- Promises added during the wait are never awaited
- This can cause the application to exit before all work is complete

## Expected Behavior
- `wait()` loops until there are no promises left
- On each iteration, `Promise.allSettled` is called on the current promise list
- Settled promises are removed from the internal array after each iteration
- If any settled promise rejected, the exception is raised (after processing all settled results)
- If no promises remain, the loop ends

## Solution

Refactor `wait()` to:

```javascript
async wait() {
  while (this.#promises.length > 0) {
    const current = [...this.#promises];
    const results = await Promise.allSettled(current);

    // Remove settled promises from the array
    this.#promises = this.#promises.filter((p) => !current.includes(p));

    const firstRejection = results.find((r) => r.status === 'rejected');
    if (firstRejection) {
      throw firstRejection.reason;
    }
  }
}
```

## Benefits
- Promises added mid-wait are no longer missed
- The application waits for all work to complete before exiting

---
See issue for details: https://github.com/darthjee/navi/issues/423

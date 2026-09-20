# Add shared job lifecycle example

Add a function that registers the lifecycle `describe`/`it` blocks common to all four job specs, taking whatever it needs from the caller (e.g. `{ buildJob, arrangeSuccess, arrangeFailure, expectedId, maxRetries }`, or getters so the job built in the caller's `beforeEach` is used). Scenarios: stores the id, is an instance of `Job`, clears `lastError` before performing, is not exhausted after a successful attempt, and is exhausted after the failing attempts (`maxRetries` decides how many).

Design constraints: register blocks under the caller's `describe` (no extra global names), and keep `it` descriptions identical to the current ones so failure output does not change. Only include scenarios that are truly identical across specs; anything with job-specific wiring (e.g. `ResourceRequestJob` asserting `axios.get` in the same `it`) stays in the spec.

## Files to Change
- `source/spec/support/utils/JobLifecycleExamples.js` — new shared-example function, documented with JSDoc

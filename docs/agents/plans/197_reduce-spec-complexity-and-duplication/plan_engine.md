# Plan: Engine_spec.js

## File
`source/spec/services/Engine_spec.js` (181 lines)

## Problem

Multiple `describe` blocks repeat `jobRegistry.enqueue({ resourceRequest: {}, parameters: {} })`
one to four times each. The call is always identical and the repetition exists only to control
how many jobs are in the queue for a given scenario.

```js
// example — "when there are jobs to process"
beforeEach(() => {
  jobRegistry.enqueue({ resourceRequest: {}, parameters: {} });
  jobRegistry.enqueue({ resourceRequest: {}, parameters: {} });
});

// example — "when there are more jobs than workers"
beforeEach(() => {
  jobRegistry.enqueue({ resourceRequest: {}, parameters: {} });
  jobRegistry.enqueue({ resourceRequest: {}, parameters: {} });
  jobRegistry.enqueue({ resourceRequest: {}, parameters: {} });
  jobRegistry.enqueue({ resourceRequest: {}, parameters: {} });
});
```

## Solution

Extract a local helper at the top of the outer `describe` block:

```js
const enqueueJobs = (n) => {
  for (let i = 0; i < n; i++) {
    jobRegistry.enqueue({ resourceRequest: {}, parameters: {} });
  }
};
```

Replace all inline repetitions with calls to this helper:

```js
// "when there are jobs to process"
beforeEach(() => { enqueueJobs(2); });

// "when there are more jobs than workers"
beforeEach(() => { enqueueJobs(4); });

// "when jobs fail all the time"
beforeEach(() => {
  DummyJob.setSuccessRate(0);
  enqueueJobs(1);
});

// "when jobs fails some times"
beforeEach(() => {
  DummyJob.setSuccessRate(0.1);
  enqueueJobs(20);
});

// etc.
```

The helper must be defined inside the outer `describe` (not at module scope) so it closes over
`jobRegistry`, which is reassigned in `beforeEach`.

## Expected outcome

- File shrinks slightly and the repeated payload `{ resourceRequest: {}, parameters: {} }` is
  defined in exactly one place.
- Changing the enqueue payload for all tests requires editing only the helper.

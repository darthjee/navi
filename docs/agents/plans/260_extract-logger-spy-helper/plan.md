# Plan: Extract shared console/Logger spy setup into a test helper

## Overview

Create a single reusable helper `stubAllLoggers()` in `spec/support/helpers/` and replace
the repeated `spyOn(console, ...)` blocks in five spec files with a single call to that helper.

## Context

Multiple spec files repeat the same four-line block:

```js
spyOn(console, 'debug').and.stub();
spyOn(console, 'info').and.stub();
spyOn(console, 'warn').and.stub();
spyOn(console, 'error').and.stub();
```

When the logging infrastructure changes, every file must be updated individually. Centralising
this in a helper eliminates the duplication and makes future changes a one-line edit.

## Implementation Steps

### Step 1 — Create `spec/support/helpers/loggerHelpers.js`

Add a new file that exports a `stubAllLoggers()` function which installs stubs on all four
`console` methods (`debug`, `info`, `warn`, `error`).

### Step 2 — Update the five affected spec files

In each file, remove the repeated spy block and replace it with a single call to
`stubAllLoggers()` inside `beforeEach`. Add the import for the helper at the top of the file,
following the existing import order conventions.

## Files to Change

- `source/spec/support/helpers/loggerHelpers.js` — *(new file)* exports `stubAllLoggers()`
- `source/spec/lib/utils/logging/Logger_spec.js` — replace spy block with helper call
- `source/spec/lib/utils/logging/BaseLogger_spec.js` — replace spy block with helper call
- `source/spec/lib/models/Worker_spec.js` — replace spy block with helper call
- `source/spec/lib/models/ResourceRequestJob_spec.js` — replace spy block with helper call
- `source/spec/lib/services/Client_spec.js` — replace spy block with helper call

## Notes

- No production code changes are required; this is a test-only refactor.
- The observable behaviour of the test suite must remain identical after the refactor.
- If any spec file stubs only a subset of the four console methods, keep the existing
  individual spies for those cases and only replace full four-line blocks with `stubAllLoggers()`.

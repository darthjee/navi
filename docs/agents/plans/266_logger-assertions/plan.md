# Plan: Replace Logger message assertions with behaviour-focused expectations

## Overview

Replace 5 exact-message Logger assertions across 3 spec files with either `toHaveBeenCalled()` or
`toHaveBeenCalledWith(jasmine.stringContaining(...))`, decoupling tests from logging implementation
details while still verifying that meaningful identifiers appear in the output.

## Context

The following exact-string Logger assertions exist in the spec suite and couple tests to log message
wording. Rephrasing or restructuring a log message breaks these tests even when the underlying
behaviour is unchanged.

| File | Line | Logger method | Key detail being tested |
|------|------|---------------|------------------------|
| `ResourceRequestJob_spec.js` | 69 | `Logger.info` | logging occurred when performing |
| `ResourceRequestJob_spec.js` | 109 | `Logger.error` | job ID appears in error log |
| `Worker_spec.js` | 140 | `Logger.error` | job ID appears in error log |
| `Client_spec.js` | 30 | `Logger.info` | request URL appears in info log |
| `Client_spec.js` | 141 | `Logger.info` | resolved URL appears in info log |

`EnvResolver_spec.js` (line 63) also asserts on a Logger message, but that test verifies
the variable name is surfaced in the warning — which is observable behaviour of `EnvResolver`, not
a logging format detail. It is excluded from this plan.

## Implementation Steps

### Step 1 — Update `ResourceRequestJob_spec.js`

**Line 69** — the test "logs info when performing" only needs to verify that `Logger.info` was
called; the exact phrasing is irrelevant:

```js
// Before
expect(Logger.info).toHaveBeenCalledWith(`ResourceRequestJob #${job.id} performing`);

// After
expect(Logger.info).toHaveBeenCalled();
```

**Line 109** — the test "logs the error" should verify the job ID appears so the log is traceable,
without pinning the exact sentence:

```js
// Before
expect(Logger.error).toHaveBeenCalledWith(`Job #${job.id} failed: ${expectedError}`);

// After
expect(Logger.error).toHaveBeenCalledWith(jasmine.stringContaining(job.id));
```

### Step 2 — Update `Worker_spec.js`

**Line 140** — the assertion is inside a multi-expectation test "register failure and attempt".
Verify the job ID appears in the error log:

```js
// Before
expect(Logger.error).toHaveBeenCalledWith(`Error occurred while performing job: #${job.id} - ${expectedError}`);

// After
expect(Logger.error).toHaveBeenCalledWith(jasmine.stringContaining(job.id));
```

### Step 3 — Update `Client_spec.js`

**Line 30** — verify the request URL appears in the info log:

```js
// Before
expect(Logger.info).toHaveBeenCalledWith(`[Client:default] Requesting ${fullUrl}`);

// After
expect(Logger.info).toHaveBeenCalledWith(jasmine.stringContaining(fullUrl));
```

**Line 141** — verify the resolved URL appears in the info log:

```js
// Before
expect(Logger.info).toHaveBeenCalledWith(`[Client:default] Requesting ${resolvedFullUrl}`);

// After
expect(Logger.info).toHaveBeenCalledWith(jasmine.stringContaining(resolvedFullUrl));
```

## Files to Change

- `source/spec/lib/models/ResourceRequestJob_spec.js` — 2 assertions replaced (lines 69, 109)
- `source/spec/lib/models/Worker_spec.js` — 1 assertion replaced (line 140)
- `source/spec/lib/services/Client_spec.js` — 2 assertions replaced (lines 30, 141)

## CI Checks

Before opening a PR, run the following checks for the folders being modified:

- `source/`: `yarn test` (CircleCI job: `jasmine`)
- `source/`: `yarn lint` (CircleCI job: `checks`)
- `source/`: `yarn report` (CircleCI job: `checks` — JSCPD duplication report)

## Notes

- No production code changes — this is purely a test assertion refactor.
- `Logger_spec.js` and `BaseLogger_spec.js` already test exact log message format and are
  unaffected by this change.
- `EnvResolver_spec.js` line 63 is intentionally excluded: the variable name in the warning is
  observable behaviour, not a logging format detail.

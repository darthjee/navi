# Plan: Use Logger in dev/app

## Overview

Replace all existing logging calls in `dev/app/` with the shared `Logger` from
`source/lib/common/utils/logging/`, which was made accessible to `dev/app` in
issue #548. This enables log suppression during tests for cleaner output.

## Context

Issue #548 exposed the common `Logger` module to `dev/app`. Now that the
infrastructure is in place, any ad-hoc `console.log` / `console.warn` /
`console.error` calls (or any other logging mechanism) in `dev/app` should be
replaced with structured calls through the shared `Logger`, consistent with how
logging is done in `source/`.

## Implementation Steps

### Step 1 — Identify existing logging in `dev/app/`

Locate all files in `dev/app/` that contain logging calls (e.g. `console.log`,
`console.warn`, `console.error`, or any other logger currently in use). Note
which classes/methods produce logs and what log levels they use.

### Step 2 — Import and wire `Logger` in `dev/app/`

For each file that needs logging, import the shared `Logger` from
`common/utils/logging/` and replace the existing calls with the appropriate
`Logger` method calls, preserving the original log levels and messages.

### Step 3 — Disable logging in tests

Ensure the test setup for `dev/app/` configures the `Logger` to suppress output
(e.g. by using a silent/no-op logger or by setting the log level to off), so
that test runs produce clean output.

### Step 4 — Update specs

Add or update specs for any classes modified in Step 2 to verify that:
- Logging calls are delegated to `Logger` (not `console` directly).
- No log output appears during the test run.

## Files to Change

- `dev/app/**/*.js` — replace existing logging with `Logger` calls
- `dev/app/spec/support/` (or equivalent test setup) — configure `Logger` to
  suppress output during tests

## Notes

- The exact files to change will be confirmed after exploring `dev/app/`.
- The mechanism for disabling logs in tests depends on how `Logger` is
  configured; this should follow the same pattern used in `source/` specs.
- `console.warn` and `console.error` are the only `console.*` calls permitted
  by ESLint in `source/`; the same rule likely applies to `dev/app/` — verify
  before replacing calls.

# Issue: Use Logger in dev/app

## Description

Now that `dev/app` has access to `Logger` from the common module (introduced in issue #548), the existing logging solution in `dev/app` should be replaced with the shared `Logger`. This ensures that logs can be suppressed during tests, resulting in cleaner test output.

## Problem

- `dev/app` currently uses its own logging solution instead of the shared `Logger` from common.
- Test output is polluted with log messages that cannot be easily disabled.

## Expected Behavior

- All logging in `dev/app` uses the shared `Logger` from common.
- During tests, logging can be disabled, producing cleaner test output.

## Solution

- Replace all existing logging calls in `dev/app` with the shared `Logger`.
- Ensure the `Logger` configuration allows disabling logs in the test environment.

## Benefits

- Consistent logging across the codebase.
- Cleaner test output by suppressing logs during test runs.

---
See issue for details: https://github.com/darthjee/navi/issues/553

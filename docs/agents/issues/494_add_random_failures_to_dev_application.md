# Issue: Add Random Failures to Dev Application

## Description
The dev application needs support for simulating random HTTP request failures, controlled by an environment variable. This allows testing Navi's retry and failure-handling behavior under realistic error conditions.

## Problem
- The dev application currently has no mechanism to simulate request failures.
- There is no way to configure a failure rate for HTTP requests during development/testing.

## Expected Behavior
- A new environment variable `DEV_APP_FAILURE_RATE` controls the probability of random failures on any HTTP request.
- Example: `DEV_APP_FAILURE_RATE=0.75` causes a 75% random failure rate.
- When the variable is not set, the failure rate defaults to 0% (no failures).
- `.env.sample` should include the variable set to `0.5` (50%) as an example.

## Solution
- Read `DEV_APP_FAILURE_RATE` from the environment in the dev application.
- On each incoming HTTP request, randomly return a failure response based on the configured rate.
- Add `DEV_APP_FAILURE_RATE=0.5` to `.env.sample`.

## Benefits
- Enables realistic testing of Navi's retry logic and failure handling without requiring an external unreliable service.
- Makes failure scenarios easy to reproduce and configure locally.

---
See issue for details: https://github.com/darthjee/navi/issues/494

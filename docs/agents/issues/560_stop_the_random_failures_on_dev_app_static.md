# Issue: Stop the Random Failures on dev/app Static

## Description

The dev/app backend applies random failures to all its endpoints. However, the static endpoints (`/` and `/assets/*`) should be exempt from this behavior, as they serve static content that must remain reliably available during development and testing.

## Problem

- Random failure middleware is applied globally across all dev/app endpoints.
- The `/` (index) and `/assets/*` (static assets) endpoints are affected by these random failures.
- Static content serving must be reliable and should not be subject to simulated failure injection.

## Expected Behavior

- Random failures continue to apply to all data/API endpoints in dev/app as intended.
- The `/` and `/assets/*` endpoints are excluded from the random failure middleware and always respond normally.

## Solution

- Update the random failure middleware in `dev/app` to skip the `/` and `/assets/*` routes.
- This can be done by adding a route guard or condition inside the middleware that returns early when the request path matches these patterns.

## Benefits

- Prevents misleading test failures caused by random errors on static routes.
- Keeps the dev environment stable for serving the frontend assets while still simulating failures on dynamic endpoints.

---
See issue for details: https://github.com/darthjee/navi/issues/560

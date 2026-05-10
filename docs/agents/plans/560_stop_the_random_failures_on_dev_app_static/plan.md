# Plan: Stop the Random Failures on dev/app Static

## Overview

Update the random failure middleware in `dev/app` to exempt the `/` and `/assets/*` routes, so that static content is always served reliably while dynamic API endpoints continue to be subject to simulated failures.

## Context

The dev/app backend injects random failures across all endpoints to simulate unreliable services. This behavior is intentional for API routes but must not affect static routes (`/` and `/assets/*`), which serve the frontend index and static assets and must always respond normally.

## Implementation Steps

### Step 1 — Identify the random failure middleware

Locate the middleware (or route-level handler) in `dev/app` responsible for injecting random failures. Confirm whether it is registered globally or per-route.

### Step 2 — Add a route exemption

Add a condition inside the middleware that skips failure injection when the request path is `/` or matches `/assets/*`. The middleware should call `next()` immediately for those paths without applying any failure logic.

### Step 3 — Update tests

Add or update tests in `dev/app` to assert that:
- `GET /` always returns a successful response regardless of the random failure seed.
- `GET /assets/<any file>` always returns a successful response regardless of the random failure seed.
- Dynamic API endpoints continue to be affected by the failure middleware.

## Files to Change

- `dev/app/<random-failure-middleware>.js` — add path exemption for `/` and `/assets/*`
- `dev/app/spec/<random-failure-middleware>_spec.js` — add tests for the exempted routes

## Notes

- Exact file name of the random failure middleware is not yet confirmed — needs a quick codebase look.
- The exemption pattern for `/assets/*` should use a prefix match (e.g., `startsWith('/assets/')`) rather than an exact match.
- No frontend or `source/` changes are needed.

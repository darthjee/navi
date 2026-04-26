# Plan: Add Delayed Middleware

## Overview

Create a new Tent middleware (`DelayMiddleware`) in `dev/proxy` that introduces a configurable response delay controlled by two environment variables (`MIN_RESPONSE_DELAY` and `MAX_RESPONSE_DELAY`), then register it and apply it to all proxy routes.

## Context

The dev proxy (`dev/proxy`) currently returns responses without any artificial delay. Adding a delay middleware allows developers to simulate slow backends and test Navi's retry and timeout behavior. The delay is configured via environment variables so it can be toggled per environment without code changes.

## Implementation Steps

### Step 1 — Create `DelayMiddleware`

Create `dev/proxy/middlewares/DelayMiddleware.php` following the same pattern as `RandomFailureMiddleware`.

- Extend `Tent\Middlewares\Middleware`.
- Implement `static build(array $attributes): self`.
- Implement `processResponse(ProcessingRequest $request): ProcessingRequest` with the delay logic:
  - Read `MIN_RESPONSE_DELAY` and `MAX_RESPONSE_DELAY` from env (integers, milliseconds).
  - Neither set → no delay, return immediately.
  - Both set → random delay between `MIN` and `MAX` ms.
  - Only `MAX_RESPONSE_DELAY` set → random delay between `0` and `MAX` ms.
  - Only `MIN_RESPONSE_DELAY` set → fixed delay of exactly `MIN` ms.
- Use `usleep($ms * 1000)` to sleep (PHP `usleep` takes microseconds).

### Step 2 — Register the middleware in `configure.php`

Add a `require_once` for the new file in `dev/proxy/configure.php`, alongside the existing `RandomFailureMiddleware` require.

### Step 3 — Apply to all routes

Add `['class' => 'Dev\\Proxy\\Middlewares\\DelayMiddleware']` to the `middlewares` array of every `Configuration::buildRule()` call in:
- `dev/proxy/rules/backend.php` (two rules)
- `dev/proxy/rules/frontend.php` (two rules)

## Files to Change

- `dev/proxy/middlewares/DelayMiddleware.php` — new file, implements the delay logic in `processResponse`
- `dev/proxy/configure.php` — add `require_once` for the new middleware
- `dev/proxy/rules/backend.php` — add `DelayMiddleware` to both rule middleware arrays
- `dev/proxy/rules/frontend.php` — add `DelayMiddleware` to both rule middleware arrays

## Notes

- `processResponse` is used (not `processRequest`) so the delay is injected after the backend responds, matching realistic slow-backend behavior.
- When neither env var is set, the middleware is a no-op — safe to include in all environments.
- PHP `usleep()` takes microseconds; multiply millisecond values by 1000.

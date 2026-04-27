# Plan: Do Not Follow Up on Redirect

## Overview

Disable automatic HTTP redirect following in the `Client` service so that 3xx responses are returned as-is to the rest of the application pipeline.

## Context

The `Client` class (in `source/lib/services/`) uses Axios to perform HTTP requests. Axios follows redirects automatically by default, which means a 3xx response is silently chased and only the final destination response reaches Navi's logging, failure handling, and status-validation logic. The fix is to disable redirect following at the Axios configuration level.

## Implementation Steps

### Step 1 — Disable redirect following in Axios

Set `maxRedirects: 0` in the Axios request config inside `Client`. This prevents Axios from following any 3xx response.

### Step 2 — Accept all HTTP status codes from Axios

By default Axios throws on non-2xx statuses (including 3xx). Since `Client` already has its own status validation (it throws `RequestFailed` when the received status does not match the expected one), Axios should not throw on its own. Set `validateStatus: () => true` so that Axios always resolves the promise and lets `Client` handle status checking.

### Step 3 — Update specs

Update `source/spec/lib/services/Client_spec.js` to:
- Assert that redirect responses (3xx) are **not** followed and are returned as received.
- Verify the Axios call is made with `maxRedirects: 0` and `validateStatus: () => true` (or equivalent).
- Add a test case where the expected status is a 3xx and the request succeeds without following the redirect.

## Files to Change

- `source/lib/services/Client.js` — add `maxRedirects: 0` and `validateStatus: () => true` to the Axios request config in both `perform()` and `performUrl()`.
- `source/spec/lib/services/Client_spec.js` — add/update specs covering redirect response handling.

## Notes

- Both `perform()` and `performUrl()` use Axios, so both need the same config changes.
- Setting `validateStatus: () => true` is safe here because `Client` already enforces the expected status via `RequestFailed`; no status validation is lost.
- This change may surface previously hidden redirect responses as failures in existing configs where the expected status was implicitly 200 (i.e. the resource was silently redirected). That is intentional — it makes Navi's behavior explicit.

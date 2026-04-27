# Issue: Do Not Follow Up on Redirect

## Description

The HTTP client currently follows redirect responses (3xx) automatically, making additional requests to the redirect target. Navi should treat redirects as final responses and return the 3xx status code to the caller without following the redirect chain.

## Problem

- When the target server responds with a 3xx redirect, the client transparently follows it
- The actual redirect response is never surfaced; only the final (post-redirect) response is returned
- This hides redirect behavior from Navi's logging, metrics, and retry logic

## Expected Behavior

- When the server returns a 3xx response, the client stops and returns that response as-is
- The 3xx status code is visible to the rest of the application (logging, failure handling, etc.)

## Solution

- Disable automatic redirect following in the HTTP client configuration (e.g., set `redirect: "manual"` or equivalent option depending on the HTTP library in use)
- Ensure the 3xx response is returned and treated like any other response by the worker pipeline

## Benefits

- Accurate response codes are recorded and logged
- Redirect responses can be retried or handled according to Navi's existing failure policies
- Prevents unintended cache-warming of redirect targets instead of the configured URLs

---
See issue for details: https://github.com/darthjee/navi/issues/394

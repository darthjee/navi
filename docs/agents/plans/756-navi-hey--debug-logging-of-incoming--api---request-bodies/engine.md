# Engine Plan: navi-hey: debug logging of incoming /api/* request bodies

Main plan: [plan.md](plan.md)

## Overview

`SecuredRequestHandler` (`source/lib/server/SecuredRequestHandler.js`) is the
shared base class for every `/api/*` handler (`ApiConfigHandler`,
`ApiEngineStartHandler`, `ApiEngineStopHandler`). Its `handle()` method already
runs `#authorize()` before delegating to `process()`. This plan adds a debug
log call right after `#authorize()` succeeds, logging method + path + the full
request body via the existing `Logger.debug` facade
(`source/lib/utils/logging/Logger.js`, re-exporting
`source/lib/common/utils/logging/Logger.js`).

Logging strictly after `#authorize()` means an unauthenticated/malicious probe
never gets its body (potentially secret-bearing, e.g. `/api/config`) written to
the debug log. No body size cap/truncation, matching the precedent set by the
sibling outbound-logging change (#754/#757,
`clients/node/lib/NaviApiClient.js:41` —
`Logger.debug('Outbound request', { method, url, body })`).

## Implementation Steps

### Step 1 — Log the request body after successful authorization

In `SecuredRequestHandler#handle()`, after `this.#authorize()` succeeds and
before `return this.process()`, add:

```js
Logger.debug('Inbound request', {
  method: this.#request.method,
  path: this.#request.path,
  body: this.#request.body,
});
```

Import `Logger` from `../utils/logging/Logger.js` at the top of the file.

Since `#authorize()` throws `ForbiddenError` on any mismatch (including no
token configured), this placement guarantees the log line only fires for
requests that passed the bearer-token check — unauthorized/malicious probes
against `/api/*` (e.g. `POST /api/config` with a resolved-secret body) never
get logged.

This only affects `/api/*` routes, since every `/api/*` handler
(`ApiConfigHandler`, `ApiEngineStartHandler`, `ApiEngineStopHandler`) extends
`SecuredRequestHandler` — no additional path-matching needed, and routes
outside `/api/*` are untouched (they don't go through this class).

### Step 2 — Add specs for the new logging behavior

In `source/spec/lib/server/SecuredRequestHandler_spec.js`, under `#handle`:

- **When the token matches**: assert `Logger.debug` is called once with
  `'Inbound request'` and `{ method, path, body }` matching the request
  object's `method`/`path`/`body`, using `spyOn(Logger, 'debug')` (import
  `Logger` from `../../../lib/utils/logging/Logger.js` in the spec).
- **When authorization fails** (existing "token is missing"/"does not
  match"/"different scheme"/"no token configured" cases): assert
  `Logger.debug` is **not** called, confirming bodies are never logged for
  rejected requests.

## Files to Change

- `source/lib/server/SecuredRequestHandler.js` — import `Logger`; log
  `'Inbound request'` with `{ method, path, body }` right after `#authorize()`
  succeeds, before `process()` is called.
- `source/spec/lib/server/SecuredRequestHandler_spec.js` — add specs covering
  the new debug log call on success, and its absence when authorization
  fails.

## CI Checks

- `source`: `npm test` (runs `npx c8 jasmine spec/**/*.js`) (CI job: `jasmine`)
- `source`: `npm run lint` (CI job: `checks`)

## Notes

- No headers are logged (explicitly out of scope per the issue).
- No body size cap/truncation — debug logging is opt-in/operator-controlled,
  and this matches the untruncated shape already shipped for outbound request
  logging in #754/#757.
- Outbound (warm-up) request logging is out of scope for this issue.

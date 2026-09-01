# Issue: navi-hey: debug logging of incoming /api/* request bodies

## Description
Spun off from #753 (investigation into majora #1241).

## Problem
`navi-hey` does not log the bodies of incoming requests. When diagnosing what a
client actually pushed (e.g. `POST /api/config`), there is no server-side record
of the received payload — only the client's side of the story, if that.

## Expected Behavior
When the configured log level is `debug`, `navi-hey` logs the full **body** of
each incoming request to the token-secured `/api/*` namespace, alongside the
method + path.

Headers are **not** logged (out of scope for this issue). Routes outside `/api/*`
are not affected.

### Out of scope

- Request headers.
- Routes outside `/api/*`.
- Outbound (warm-up) request logging.

## Solution
- **Hook point**: `SecuredRequestHandler#handle()` (`source/lib/server/SecuredRequestHandler.js`),
  right after `#authorize()` succeeds and before `process()` is called — not a
  standalone Express middleware.
  - Every `/api/*` handler (`ApiConfigHandler`, `ApiEngineStartHandler`,
    `ApiEngineStopHandler`) already extends this base, so the `/api/*`-only
    scoping falls out for free with no path-matching of its own.
  - Logging strictly after `#authorize()` means an unauthenticated/malicious
    probe never gets its body (potentially secret-bearing, e.g. `/api/config`)
    written to the debug log — only requests that pass the bearer-token check
    are logged.
  - Keeps the "access log" (`RouteRegister`'s `method + path + status`, logged
    generically for every route after `handle()` returns) and the new "body
    log" close together in intent without merging their concerns into one
    class.
- **No body size cap / truncation**: follow the precedent set by the sibling
  outbound-logging change (#754/#757, `clients/node/lib/NaviApiClient.js`),
  which logs `Logger.debug('Outbound request', { method, url, body })` with
  the full, untruncated body. This inbound change mirrors that shape —
  `Logger.debug('Inbound request', { method, path, body })` — for consistency
  across both sides of the same feature. Debug logging is opt-in/operator-
  controlled, so this is an acceptable tradeoff.
- `/api/config` bodies contain already-resolved secret values — this is why it is
  strictly gated behind `debug`.
- Use the existing `Logger.debug` facade.

## Benefits
Gives operators a server-side record of exactly what a client pushed to
`/api/*`, closing the diagnostic gap identified while investigating majora
#1241 — without exposing anything beyond opt-in, operator-controlled `debug`
logging.

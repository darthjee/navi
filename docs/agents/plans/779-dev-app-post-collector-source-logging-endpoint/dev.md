# dev Plan: dev/app: POST /collector/:source logging endpoint

Main plan: [plan.md](plan.md)

## Overview

Register `POST /collector/:source` in `dev/app/`, keeping the existing config-array →
`HandlerConfig` → `RouteRegister` style. A new `CollectorHandler` (a `RequestHandler`
subclass) logs `{ source, body }` via the shared `Logger` and responds `204` — no
persistence, no read-back, no validation of `:source`. `app.js` gains
`express.json({ limit: '1mb' })`; `RouteRegister.register()` becomes method-aware instead
of growing a parallel `registerPost`; the route is driven from a new
`collector_routes.config.js`; and `FailureSimulator` is extended to exempt the
`/collector/` prefix so emissions never receive a simulated `502`.

## Context

Current state of `dev/app/` (verified against the code):

- `app.js#buildApp(data, failureRate = 0)` chains `morgan` → a `FailureSimulator`
  middleware → `new Router(data).build()` → a 404 fallback. **No body-parsing middleware.**
- `lib/routing/RouteRegister.js` has a single `register(route, handler)` that hard-codes
  `this.#router.get(route, ...)`, guarded by a `#routes` array of bare patterns with a
  duplicate-pattern throw, plus a `routes()` introspection method. `routes()` has **no
  production consumer** — only `spec/lib/routing/RouteRegister_spec.js`.
- `lib/routing/Router.js#build()` contains **zero inline route bindings**: it iterates
  `ROUTES` (`routes.config.js`) and `REDIRECT_ROUTES` (`redirect_routes.config.js`) through
  `register.register(...)`, then `router.use(express.static(staticDir))`, then a
  method/path-agnostic SPA catch-all `router.use((_req, res) => new HandlerConfig(IndexHandler).handle(...))`.
- `lib/models/FailureSimulator.js` early-`next()`s when `#isStaticPath(req.path)` is true
  (`path === '/' || path.startsWith('/assets/')`); otherwise it injects a `502` at rate
  `DEV_APP_FAILURE_RATE`.
- Handlers subclass `RequestHandler` (`lib/common/server/RequestHandler.js`), constructed
  as `new Handler(request, response, ...configParams)` by `HandlerConfig.handle(req, res)`.
  `IndexHandler` takes no extra params — the closest match for `CollectorHandler`.
- Shared logger: `Logger.info(message, attributes = {})` → `console.info`, imported as
  `{ Logger }` from `lib/common/utils/logging/Logger.js`.
- `lib/common/` is a **gitignored mirror** of `source/lib/common` (CI recreates it via
  `scripts/ci.sh setup-dev`). `Logger.js` and `RequestHandler.js` live there — **do not
  edit them**; consume as-is.
- Tests: Jasmine 5 + Supertest 7, `spec/` mirrors `lib/`. `spec/app_spec.js` builds
  `buildApp(data)` and, in its `failureRate = 1` block, `buildApp(data, 1)`.
- `express@4.22.1` is installed (declares `^4.18.0`) and bundles `body-parser` — `express.json()`
  needs no new dependency.

## Steps

- [01 — Add JSON body parsing to app.js](dev/01-add-json-body-parsing.md)
- [02 — Make RouteRegister method-aware](dev/02-method-aware-route-register.md)
- [03 — Add the collector route and CollectorHandler](dev/03-collector-route-and-handler.md)
- [04 — Exempt /collector from FailureSimulator](dev/04-failuresimulator-collector-exemption.md)
- [05 — Integration tests in app_spec.js](dev/05-integration-tests.md)
- [06 — Document the endpoint in dev-app.md](dev/06-update-dev-app-docs.md)

## CI Checks

- `dev/app`: `npm run coverage` — Jasmine + c8 (CI job: `jasmine-dev`). CI first runs
  `scripts/ci.sh setup-dev` to mirror `source/lib/common` into `dev/app/lib/common`; locally
  that folder already exists. Equivalent local command: `cd dev/app && yarn coverage`.
- `dev/app`: `scripts/ci.sh lint-and-report dev/app` — ESLint + jscpd (CI job: `checks-dev`).
  Equivalent local commands: `cd dev/app && yarn lint && yarn report`.

The issue's acceptance criterion is `cd dev/app && yarn coverage && yarn lint && yarn report`.

## Notes

- **Approach chosen over the issue's alternatives**: the issue offered `registerPost()` or an
  inline `router.post(...)`. Per discussion, `RouteRegister.register()` instead gains an
  optional `method` (defaulting to `'get'`) and route-config entries carry an optional
  `method` field — one code path for all verbs, dup-guard and `routes()` introspection kept.
- Changing the dup-guard key to `` `${method} ${route}` `` also changes `routes()` output
  from bare patterns to `"<method> <route>"`. Only `RouteRegister_spec.js` asserts on it —
  update those three assertions. No other consumer.
- `express.json()` only fills `req.body` for `Content-Type: application/json`; otherwise
  `req.body === {}`. `CollectorHandler` must tolerate an empty/missing body. Malformed JSON
  yields Express's default `400` (no error middleware in `app.js`) — acceptable, not logged.
- `:source` is a single path segment (no traversal risk) and only logged — accepted verbatim,
  no validation, per the issue.
- Non-POST verbs on `/collector/:source` keep falling through to the SPA catch-all
  (`index.html`, 200). Acceptable for a demo target.
- The demo-config sub-issue of #777 depends on this: its `emit.url` values must match
  `/collector/:source` exactly.

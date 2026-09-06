# Issue: dev/app: POST /collector/:source logging endpoint

## Description

Parent: #777 — Demo: crawl the Oak app and emit extracted data to a collector endpoint on the demo dev app.

The `navi-hey` demo needs a target endpoint that Navi's `emit` can POST extracted crawl items to. The demo dev app (`dev/app/`) is the natural home: it is already deployed as the demo's crawl target (`dockerfiles/demo_dev_app/`). This sub-issue adds a minimal endpoint there that **only logs** what it receives — no persistence, no read-back API.

Current state of `dev/app/`:

- Every route is `GET`. `dev/app/lib/routing/RouteRegister.js` hard-codes `this.#router.get(...)`.
- There is **no body-parsing middleware** — `dev/app/app.js` wires `morgan`, a `FailureSimulator` middleware, then `new Router(data).build()`, then a 404 fallback. Nothing reads `req.body`.
- Route definitions are plain data arrays (`ROUTES` in `lib/routing/routes.config.js`, `REDIRECT_ROUTES` in `lib/routing/redirect_routes.config.js`) turned into handler classes via `HandlerConfig` + a `RequestHandler` subclass (`ContentHandler`, `CollectionHandler`, etc.).
- `dev/app/lib/models/FailureSimulator.js` injects a `502` at rate `DEV_APP_FAILURE_RATE` on every request except `/` and `/assets/*` (`#isStaticPath`).
- Shared logger: `dev/app/lib/common/utils/logging/Logger.js` (`Logger.info(msg, attributes)` → `console.info`), mounted from `source/lib/common`.
- Tests: Jasmine 5 + Supertest 7, `dev/app/spec/` mirrors `lib/`; `spec/app_spec.js` is the integration suite and already builds `buildApp(data, 1)` to assert failure-rate behaviour.

## Problem

The demo dev app currently exposes only GET crawl-target routes. There is nowhere for Navi's `emit` to POST extracted crawl items during the `navi-hey` demo, so the emit half of #777 cannot be exercised end-to-end.

## Expected Behavior

- [ ] `POST /collector/:source` with a JSON body responds `204` with no response body and logs `{ source, body }` via the shared `Logger`. `:source` is accepted verbatim (no validation) and only logged.
- [ ] The endpoint responds `204` (never a simulated `502`) even when `buildApp(data, 1)`.
- [ ] `express.json({ limit: '1mb' })` is registered in `dev/app/app.js`; existing GET routes are unaffected.
- [ ] `RouteRegister.register()` is method-aware (defaults to GET); existing GET route configs are unchanged in behaviour.
- [ ] New Jasmine/Supertest coverage for the handler, the method-aware register, the `FailureSimulator` exemption, and the route.
- [ ] `docs/agents/dev-app.md` documents the endpoint.
- [ ] `cd dev/app && yarn coverage && yarn lint && yarn report` passes.

## Solution

- Add `express.json({ limit: '1mb' })` in `dev/app/app.js`, wired after the `FailureSimulator` middleware and before `app.use(new Router(data).build())`. Express 4.x already bundles it — no new dependency. The raised limit (default is 100 kb) gives headroom for crawl emission payloads; `/collector` is the only route with a body today.
- Make `RouteRegister.register()` method-aware instead of adding a parallel `registerPost`. Give it an HTTP method (e.g. `register(route, handler, method = 'get')`) that dispatches `this.#router[method](route, ...)`; key the duplicate-route guard by `` `${method} ${route}` `` so the same pattern can carry different verbs, and have `routes()` return the `method route` keys. Route-config entries gain an optional `method` field (`{ route, method?, ... }`); existing entries omit it and default to GET. `Router.build()` threads `method` through from each entry.
- Drive the collector route from a small new config array — `dev/app/lib/routing/collector_routes.config.js` exporting `[{ route: '/collector/:source', method: 'post' }]` — iterated in `Router.build()` before the `express.static` / SPA catch-all `router.use(...)` calls: `register.register(route, new HandlerConfig(CollectorHandler), method)`.
- Add `dev/app/lib/handlers/CollectorHandler.js` — a `RequestHandler` subclass, `constructor(request, response)` (no extra params). `handle()`:
  - reads `request.params.source` and `request.body`, tolerating an empty / `{}` / missing body,
  - `Logger.info('CollectorHandler: received emission', { source, body })`,
  - `response.status(204).end()`.
  - No persistence, no GET counterpart. `:source` is accepted verbatim and only logged — no validation or sanitisation.
- Route: `POST /collector/:source`. Each emitting resource in the demo config will POST to its own `<source>` sub-path (e.g. `/collector/oak-categories`) so the logs are self-describing.
- Exempt the endpoint from failure injection: add a `/collector/` prefix constant to `FailureSimulator` and OR it into the early-`next()` guard (alongside `/` and `/assets/`). Emissions must never get a simulated `502`.
- Tests:
  - `dev/app/spec/lib/handlers/CollectorHandler_spec.js` — spies `Logger.info` and asserts the `{ source, body }` payload, the `204` response, and empty / missing body handling.
  - `dev/app/spec/lib/routing/RouteRegister_spec.js` — a `method: 'post'` registration binds POST, the method-scoped duplicate guard, and `routes()` output.
  - `dev/app/spec/lib/models/FailureSimulator_spec.js` — `/collector/x` passes through under `failureRate = 1`.
  - `dev/app/spec/app_spec.js` — `POST /collector/x` with a JSON body → `204`; and with `buildApp(data, 1)` still → `204` (not `502`).
- Update `docs/agents/dev-app.md` — add the route to the routes table and note `express.json({ limit: '1mb' })`, the method-aware `RouteRegister`, and the `FailureSimulator` exemption. Optionally fix the stale `IndexRequestHandler.js` → `IndexHandler.js` reference while there.

### Notes

- Owner: `dev` agent.
- No dependency on the other #777 sub-issues; can proceed in parallel with the `json_path` engine work.
- The demo-config sub-issue depends on this: its `emit.url` values must match the `/collector/:source` route exactly.

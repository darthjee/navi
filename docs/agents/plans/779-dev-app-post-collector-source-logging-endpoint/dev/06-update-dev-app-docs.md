# Document the endpoint in dev-app.md

Update `docs/agents/dev-app.md` to reflect the new endpoint and supporting changes:

- Add `POST /collector/:source` to the routes table — logs `{ source, body }` via the shared
  `Logger`, responds `204` with no body, no persistence, no read-back.
- Note that `dev/app/app.js` now registers `express.json({ limit: '1mb' })` ahead of routing.
- Note that `RouteRegister.register()` is method-aware: `method` defaults to `'get'`, and
  route-config entries may set `method: 'post'`; the collector route is driven from
  `lib/routing/collector_routes.config.js`.
- Note that the `FailureSimulator` pass-through now also covers the `/collector/` prefix
  (and the `#isStaticPath` → `#isExemptPath` rename).
- While editing, fix the stale reference to `IndexRequestHandler.js` — the file is
  `IndexHandler.js`.

## Files to Change

- `docs/agents/dev-app.md` — routes table entry + notes on `express.json`, method-aware
  `RouteRegister`, `collector_routes.config.js`, and the `FailureSimulator` exemption; fix
  the `IndexRequestHandler.js` reference.

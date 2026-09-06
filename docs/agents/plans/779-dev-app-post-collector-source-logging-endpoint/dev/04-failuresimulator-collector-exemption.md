# Exempt /collector from FailureSimulator

`dev/app/lib/models/FailureSimulator.js` injects a `502` at rate `DEV_APP_FAILURE_RATE` on
every request whose path is not `/` and not under `/assets/` (`#isStaticPath(req.path)` →
early `next()`). Emissions must never receive a simulated `502`, so the `/collector/` prefix
must also be exempt.

- Add a module constant `COLLECTOR_PREFIX = '/collector/'` alongside `STATIC_ROOT` and
  `STATIC_ASSETS_PREFIX`.
- Extend the check to
  `path === STATIC_ROOT || path.startsWith(STATIC_ASSETS_PREFIX) || path.startsWith(COLLECTOR_PREFIX)`.
  `req.path` excludes the query string, so `startsWith` is safe.
- Rename `#isStaticPath` → `#isExemptPath` (update its call site and JSDoc) — it is no longer
  only about static assets.

Spec updates in `dev/app/spec/lib/models/FailureSimulator_spec.js`:

- Update any `describe`/`it` wording tied to the old `#isStaticPath` name / "static path"
  phrasing.
- Add a block parallel to the existing `/` and `/assets/app.js` cases under `failureRate = 1`,
  asserting a request with `req.path = '/collector/x'` always calls `next()` and never
  produces a `502`.

## Files to Change

- `dev/app/lib/models/FailureSimulator.js` — add `COLLECTOR_PREFIX`, extend the exemption
  check, rename `#isStaticPath` → `#isExemptPath`.
- `dev/app/spec/lib/models/FailureSimulator_spec.js` — update wording for the rename; add a
  `/collector/x` pass-through case under `failureRate = 1`.

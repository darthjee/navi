# Part 5 — Specs

## Goal

Add and update specs to cover the refactored components.

## Steps

- Add or update specs for `RequestHandler` covering the base class contract.
- Add or update specs for all handlers that now extend `RequestHandler`, verifying the unified API.
- Add or update specs for the unified registry (registration and dispatch).
- Add or update specs for `Router.js` using the single registry.

## Files to Change

- `dev/app/spec/lib/RequestHandler_spec.js` — base class contract
- `dev/app/spec/lib/RedirectHandler_spec.js` — inheritance and unified API
- `dev/app/spec/lib/RouteRegister_spec.js` (or unified registry spec) — registration and dispatch
- `dev/app/spec/lib/Router_spec.js` — single registry wiring

## Open Questions

- Where do the dev app specs currently live — `dev/app/spec/` or somewhere else?
- Are there existing specs for `RedirectRegister` that should be deleted or migrated?

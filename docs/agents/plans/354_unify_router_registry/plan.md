# Plan: Unify Router Registry

## Overview

Refactor `dev/app/lib/Router.js` to replace its two separate registries (`RouteRegister` and `RedirectRegister`) with a single unified registry. Introduce (or consolidate) a base `RequestHandler` class that all handler types extend, so the registry can work uniformly with any handler.

## Context

The dev app router currently maintains two registries — one for content routes (`RouteRegister`) and one for redirects (`RedirectRegister`) — whose handlers expose different APIs. A base `RequestHandler` class already exists in `dev/app/lib/RequestHandler.js` but may not yet be used as a shared parent by all handler types. Unifying the registry simplifies the router and makes it trivially extensible.

## Implementation Steps

### Step 1 — Consolidate the base `RequestHandler` class

Ensure `dev/app/lib/RequestHandler.js` defines the full common API that all handlers must implement (e.g. a `handle(req, res)` or equivalent method). If any handler currently implements this API independently, move the shared contract into the base class.

### Step 2 — Make all handlers extend `RequestHandler`

Update `dev/app/lib/RedirectHandler.js` (and any other handler that does not yet inherit from `RequestHandler`) to extend the base class and implement the unified API.

### Step 3 — Unify the registries

Merge `RedirectRegister` into `RouteRegister` (or create a new unified `Registry` class) so that a single registry can hold both content and redirect handlers. The unified registry should work with any `RequestHandler` subclass without caring about the specific handler type.

### Step 4 — Update `Router.js`

Refactor `dev/app/lib/Router.js` to use only the unified registry. Remove the second registry instantiation and any branching logic that distinguished between the two handler types.

### Step 5 — Write / update specs

Add or update spec files to cover:
- The unified base `RequestHandler` contract.
- The unified registry (registration and dispatch).
- `Router.js` using the single registry.

### Step 6 — Update documentation

Update `docs/agents/dev-app.md` to reflect the new unified registry and handler inheritance structure.

## Files to Change

- `dev/app/lib/RequestHandler.js` — define/consolidate the common handler API
- `dev/app/lib/RedirectHandler.js` — extend `RequestHandler`
- `dev/app/lib/RouteRegister.js` or new unified registry — merge redirect registration
- `dev/app/lib/RedirectRegister.js` — remove or absorb into the unified registry
- `dev/app/lib/Router.js` — use single registry only
- `dev/app/spec/` — add/update specs for the above
- `docs/agents/dev-app.md` — document the unified handler/registry design

## Notes

- `RequestHandler.js` already exists — need to check whether it is currently used as a parent by content handlers, redirect handlers, or neither.
- `RedirectRegister.js` may be deleted entirely if its logic is absorbed by `RouteRegister`.
- The routes config files (`routes.config.js`, `redirect_routes.config.js`) may need to be unified or kept separate depending on how registration works.

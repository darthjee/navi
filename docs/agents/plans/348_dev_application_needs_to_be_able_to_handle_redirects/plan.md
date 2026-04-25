# Plan: Dev Application Needs to Be Able to Handle Redirects

## Overview

Add HTTP redirect routes to `dev/app` so that browser requests to plain paths (e.g., `/categories`)
are redirected to their hash-based equivalents (e.g., `/#/categories`). Update the proxy rules in
`dev/proxy/rules/backend.php` to forward these path-based requests to the backend. Update
`docs/agents/` to reflect the new routes and proxy configuration.

## Context

With issue #346 the dev frontend migrated to hash-based routing (`/#/...`). The dev backend
(`dev/app`) only serves JSON data and has no redirect capability. Without redirect routes,
navigating directly to `/categories` hits the proxy's static file rule and returns an HTML file
instead of redirecting to the correct frontend page. The proxy's `backend.php` also currently only
forwards `.json` requests to `navi_dev_app`, so non-json paths never reach the Express app.

## Implementation Steps

### Step 1 — Create `RedirectHandler`

Create `dev/app/lib/RedirectHandler.js`, analogous to `RequestHandler`, but instead of serving
JSON it issues an HTTP 302 redirect to the hash-based equivalent path:

```js
// given route '/categories/:id' and params { id: '5' }
// redirects to '/#/categories/5'
```

The class receives the redirect target template (e.g., `'/#/categories/:id'`) and resolves route
params into the final URL at request time.

### Step 2 — Add redirect route definitions

Add redirect route entries to `dev/app/lib/routes.config.js` (or a dedicated
`redirect_routes.config.js`), one per path:

| From | To |
|---|---|
| `/categories` | `/#/categories` |
| `/categories/:id` | `/#/categories/:id` |
| `/categories/:id/items` | `/#/categories/:id/items` |
| `/categories/:categoryId/items/:id` | `/#/categories/:categoryId/items/:id` |

### Step 3 — Register redirect routes in `Router`

Update `dev/app/lib/Router.js` to register the redirect routes alongside the existing JSON routes.
The redirect routes must be registered **before** the JSON catch-all so they take priority for
non-json paths.

`RouteRegister` currently only wires `RequestHandler`. Either:
- Extend `RouteRegister#register` to accept an optional `redirect` target and instantiate
  `RedirectHandler` when present, or
- Create a parallel `RedirectRegister` class following the same pattern.

### Step 4 — Update the proxy `backend.php`

Add a new rule in `dev/proxy/rules/backend.php` that forwards path-based requests to the backend:

```php
Configuration::buildRule([
  'handler' => [
    'type' => 'default_proxy',
    'host' => 'http://backend:80'
  ],
  'matchers' => [
    ['method' => 'GET', 'uri' => '/categories', 'type' => 'begins_with']
  ]
]);
```

This rule must be placed **after** the existing `.json` rule so JSON API requests are still matched
first. No `RandomFailureMiddleware` — redirect responses are not cached and failure simulation is
not relevant here.

### Step 5 — Write tests

- `dev/app/spec/lib/RedirectHandler_spec.js` — unit tests for redirect URL building and response
- Update `dev/app/spec/lib/Router_spec.js` — verify redirect routes are registered
- Update `dev/app/spec/app_spec.js` — end-to-end: `GET /categories` responds 302 with
  `Location: /#/categories`, same for all four paths

### Step 6 — Update `docs/agents/dev-app.md`

- Add `RedirectHandler` to the classes table with its responsibility
- Add the four redirect routes to the routes table:

| Method | Path | Description | Response |
|--------|------|-------------|----------|
| GET | `/categories` | Redirect to hash SPA route | 302 → `/#/categories` |
| GET | `/categories/:id` | Redirect to hash SPA route | 302 → `/#/categories/:id` |
| GET | `/categories/:id/items` | Redirect to hash SPA route | 302 → `/#/categories/:id/items` |
| GET | `/categories/:categoryId/items/:id` | Redirect to hash SPA route | 302 → `/#/categories/:categoryId/items/:id` |

### Step 7 — Update `docs/agents/dev-proxy.md`

- Update the `backend.php` section to show the new redirect-forwarding rule
- Update the **Request flow** section to note that `begins_with /categories` requests are proxied
  to `navi_dev_app` for redirect handling

## Files to Change

- `dev/app/lib/RedirectHandler.js` — new class (create)
- `dev/app/lib/routes.config.js` — add redirect route definitions
- `dev/app/lib/Router.js` — register redirect routes
- `dev/app/lib/RouteRegister.js` — support redirect registration (or create `RedirectRegister.js`)
- `dev/app/spec/lib/RedirectHandler_spec.js` — new spec file (create)
- `dev/app/spec/lib/Router_spec.js` — add redirect route coverage
- `dev/app/spec/app_spec.js` — add end-to-end redirect tests
- `dev/proxy/rules/backend.php` — add rule to forward `/categories*` to backend
- `docs/agents/dev-app.md` — document `RedirectHandler` and redirect routes
- `docs/agents/dev-proxy.md` — update `backend.php` section and request flow

## Notes

- The redirect rule in the proxy uses `begins_with /categories`, which catches all four paths with
  a single matcher. The `.json` rule comes first so JSON API requests are unaffected.
- HTTP 302 (temporary redirect) is preferred over 301 since the target URLs may evolve.
- `RouteRegister` currently guards against duplicate route registration — ensure redirect routes
  use different patterns from the JSON routes (they do: `/categories` vs `/categories.json`).

## CI Checks

Before opening a PR, run the following checks for the folders being modified:

- `dev/app`: `cd dev/app; yarn coverage` (CircleCI job: `jasmine-dev`)
- `dev/app`: `cd dev/app; yarn lint` (CircleCI job: `checks-dev`)

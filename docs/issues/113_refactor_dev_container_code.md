# Issue: Refactor Dev Container Code

## Description

The dev container code (under `dev/`) still requires further refactoring. In particular, `dev/lib/Router.js` registers some routes manually with inline handlers instead of using `RouteRegistrar`, because the current abstraction is not flexible enough to cover all cases. The `/categories.json` and `/categories/:id.json` routes apply custom response transformations that `RouteRegistrar` does not currently support.

This issue also includes renaming `RouteRegistrar` to `RouteRegister` for naming consistency.

## Problem

- `Router.js` mixes two approaches: some routes use `RouteRegistrar`, others are defined inline with custom logic.
- The inline routes (`/categories.json` and `/categories/:id.json`) apply field-level transformations to the navigation result before responding, which `RouteRegistrar` cannot handle today.
- The class name `RouteRegistrar` is inconsistent — it should be `RouteRegister`.

## Expected Behavior

- All routes in `Router.js` should be registered through `RouteRegister` (renamed from `RouteRegistrar`).
- A new `RequestHandler` class should encapsulate the request-handling logic (data navigation, 404 handling, JSON response) currently inlined inside `RouteRegistrar`.
- `RouteRegister#register` should accept a handler function that internally builds and invokes a `RequestHandler`, rather than containing that logic itself.
- No inline route handlers should remain in `Router.js`.

## Solution

- Extract the request-handling logic from `RouteRegistrar` into a new `RequestHandler` class (`dev/lib/RequestHandler.js`).
  - `RequestHandler` receives the route pattern, request params, data, and an optional response-mapper function.
  - It runs `RouteParamsExtractor` → `DataNavigator`, applies the mapper, and calls `res.json()` or `notFound(res)`.
- Rename `RouteRegistrar` → `RouteRegister`. Its `register` method now accepts a handler function (which wraps a `RequestHandler` call) instead of owning the handling logic directly.
- `Router.js` calls `register(route, handlerFn)` for every route, passing a function that instantiates `RequestHandler` with the appropriate mapper where needed.
- Rename the file and class from `RouteRegistrar` to `RouteRegister` and update all references.

## Benefits

- Consistent, centralised route registration with no duplicated boilerplate.
- Easier to add new routes in the future without touching handler logic directly in `Router.js`.
- Cleaner, more readable `Router.js`.

---
See issue for details: https://github.com/darthjee/navi/issues/113

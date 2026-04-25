# Issue: Dev Application Needs to Be Able to Handle Redirects

## Description

The dev application (`dev/app`) currently only serves JSON data via its API endpoints. It needs to
also handle redirect routes so that plain path requests (e.g., `/categories`) are redirected to the
corresponding hash-based frontend routes (e.g., `/#/categories`). This enables the dev backend to
properly direct browser requests to the React SPA now that it uses hash-based routing (issue #346).

## Problem

- `dev/app` has no redirect capability — it only responds with JSON or 404
- Browser or Navi requests to `/categories`, `/categories/:id`, etc. receive JSON or a 404, not an
  HTML redirect to the frontend SPA
- Without redirects, direct navigation to path-based URLs won't land on the correct frontend page

## Expected Behavior

The dev application should respond with HTTP redirects for the following routes:

| Request path | Redirect target |
|---|---|
| `/categories` | `/#/categories` |
| `/categories/:id` | `/#/categories/:id` |
| `/categories/:id/items` | `/#/categories/:id/items` |
| `/categories/:categoryId/items/:id` | `/#/categories/:categoryId/items/:id` |

All other routes continue to behave as before (JSON responses or 404).

## Solution

- Add redirect route handlers in `dev/app` for each of the listed paths
- Each handler should issue an HTTP 302 (or 301) redirect to the corresponding `/#/...` URL,
  substituting any route parameters into the target path
- Extend the existing `Router` class (or add a new rule file) to register these redirect routes
  alongside the existing JSON routes

## Benefits

- Enables seamless browser navigation from plain paths to the hash-based SPA
- Keeps the backend and frontend routing strategies in sync after the hash routing migration
- Allows Navi or other clients to follow redirects and reach the correct frontend pages

---
See issue for details: https://github.com/darthjee/navi/issues/348

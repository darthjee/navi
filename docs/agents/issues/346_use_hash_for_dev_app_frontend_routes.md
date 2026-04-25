# Issue: Use # for Dev App Frontend Routes

## Description

The dev frontend application currently exposes routes using standard path-based navigation. These routes need to be converted to hash-based routing (`/#/...`) so the app works as a Single Page Application (SPA), where the server always serves `index.html` and navigation is handled entirely on the client side.

## Problem

- Current routes use plain paths: `/categories`, `/categories/:id`, `/categories/:id/items`, `/categories/:categoryId/items/:id`
- Path-based routing requires the server to handle each route individually
- The proxy must redirect all frontend routes to `index.html` for SPA navigation to work
- Without hash-based routing, deep linking and page refreshes result in 404 errors from the proxy

## Expected Behavior

- All frontend routes use the `#` prefix:
  - `/#/categories`
  - `/#/categories/:id`
  - `/#/categories/:id/items`
  - `/#/categories/:categoryId/items/:id`
- The server (proxy) only needs to serve `index.html` for any `GET /` request; the client router handles the rest
- Page refresh and direct URL access work correctly for all routes

## Solution

- Update the frontend router to use hash-based routing (e.g., switch to hash history mode in React Router or equivalent)
- Ensure all internal `<Link>` components and `navigate()` calls reference the new `/#/...` paths
- Verify the dev proxy configuration correctly serves `index.html` for all frontend routes

## Benefits

- Eliminates the need for server-side route handling for frontend paths
- Simplifies the proxy configuration
- Enables proper deep linking and page refresh behavior in the SPA

---
See issue for details: https://github.com/darthjee/navi/issues/346

# Issue: Add Cache for Dev Frontend Requests

## Description

The dev proxy (`dev/proxy`) currently only configures caching for backend requests. Frontend requests are not cached, which means Navi cannot be used to test cache warm-up for the frontend in the development environment.

## Problem

- `Tent\Middlewares\FileCacheMiddleware` is only applied to backend routes in the dev proxy
- Frontend requests always hit the origin, bypassing the cache layer
- It is not possible to verify that Navi correctly warms the frontend cache in development

## Expected Behavior

- The dev proxy should apply `Tent\Middlewares\FileCacheMiddleware` to frontend requests as well
- After Navi warms the cache, subsequent frontend requests should be served from the cache

## Solution

- Configure `Tent\Middlewares\FileCacheMiddleware` for all frontend request routes in the dev proxy configuration
- This change is scoped to `dev/proxy` only and does not affect production

## Benefits

- Enables end-to-end testing of frontend cache warm-up via Navi in the development environment
- Keeps dev and production proxy behaviour aligned for cache testing purposes

---
See issue for details: https://github.com/darthjee/navi/issues/396

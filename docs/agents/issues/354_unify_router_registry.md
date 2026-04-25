# Issue: Unify Router Registry

## Description

The dev app router (`dev/app/lib/Router.js`) currently has two separate route registries — one for content routes and one for redirect routes. The request handlers for each type respond to different APIs. The goal is to refactor them into a single unified registry where all request handlers share a common API.

## Problem

- `dev/app/lib/Router.js` maintains two distinct registries: one for content routes and one for redirects.
- The different handler types expose different APIs, making the router logic inconsistent and harder to extend.
- Adding new route types would require yet another registry, increasing fragmentation.

## Expected Behavior

- A single route registry in `dev/app/lib/Router.js` handles all route types.
- All request handlers (content, redirect, and any future types) implement a unified API.

## Solution

- Introduce a base `RequestHandler` class in `dev/app/lib/` that defines the common API all handlers must implement.
- Refactor existing content and redirect handlers to extend this base class.
- Refactor `dev/app/lib/Router.js` to use a single registry that works with any `RequestHandler` subclass.

## Benefits

- Simpler, more consistent router logic.
- Easier to add new route types in the future without introducing yet another registry.
- Reduced duplication and cognitive overhead when working with the routing layer.

---
See issue for details: https://github.com/darthjee/navi/issues/354

# Issue: Unify Request Handler Strategy

## Description

`dev/app/lib/routing/Router.js` still uses `RequestHandler` subclasses to instantiate `RequestHandlerExecutor` objects. Now that `HandlerConfig` exists and `source` has been updated to wire executor classes directly, `dev/app` should adopt the same pattern — using `HandlerConfig` to wrap the appropriate `RequestHandlerExecutor` and removing the `RequestHandler` layer from `dev/app` entirely.

## Problem

- `dev/app/lib/routing/Router.js` still creates `RequestHandler` instances that in turn create `RequestHandlerExecutor` instances, maintaining the same unnecessary double-delegation that was removed from `source`.
- The two applications now use inconsistent strategies for routing requests to executors.
- `RequestHandler` subclasses in `dev/app` (e.g., `IndexRequestHandler`, `ContentHandler`, `CollectionHandler`, `RedirectHandler`) exist solely to delegate to their executor and add no logic of their own.

## Expected Behavior

- `dev/app/lib/routing/Router.js` uses `HandlerConfig` to configure routes with executor classes directly.
- All concrete `RequestHandler` subclasses in `dev/app` are removed (along with their tests).
- The base `RequestHandler` class in `common/server/` may now also be removed, since neither `source` nor `dev/app` will have any concrete subclasses.
- Request routing in both `source` and `dev/app` follows the same unified `HandlerConfig` → `RequestHandlerExecutor` pattern.

## Solution

1. Update `dev/app/lib/routing/Router.js` to use `HandlerConfig` with executor classes instead of `RequestHandler` subclasses.
2. Delete all concrete `RequestHandler` subclasses from `dev/app/lib/handlers/` and their specs.
3. Evaluate whether the base `RequestHandler` class (and its spec) can now be removed from `common/server/`.
4. Update `docs/agents` to reflect the unified strategy.

## Benefits

- Consistent request-handling strategy across both `source` and `dev/app`.
- Further reduces boilerplate: `RequestHandler` subclasses in `dev/app` are eliminated.
- Potentially removes the base `RequestHandler` class entirely if it is no longer needed anywhere.

---
See issue for details: https://github.com/darthjee/navi/issues/579

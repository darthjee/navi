# Issue: Rely on RequestHandlerExecutor in source

## Description

Now that `HandlerConfig` is the entry point for all requests in `source`, there is no need for the intermediate `RequestHandler` layer. Instead of configuring `HandlerConfig` with a `handler_class` (which then builds a `RequestHandler`, which then builds a `RequestHandlerExecutor`), we can configure `HandlerConfig` directly with the `handler_executor_class` and eliminate the `RequestHandler` middle layer entirely.

This allows removing all concrete `RequestHandler` subclasses from `source`, keeping only the base `RequestHandler` class (since `dev/app` still uses it).

## Problem

- Each request in `source` goes through an unnecessary intermediate layer: `HandlerConfig` → `RequestHandler` → `RequestHandlerExecutor`.
- All concrete `RequestHandler` subclasses in `source` (e.g., `IndexRequestHandler`, `LinksRequestHandler`, etc.) exist solely to delegate to their corresponding executor — they add no logic of their own.
- This double-delegation increases boilerplate without adding value.

## Expected Behavior

- `HandlerConfig` in `source` is configured directly with the `RequestHandlerExecutor` subclass and the relevant parameters.
- When a request arrives, `HandlerConfig` instantiates the executor directly and calls `handle()`.
- All concrete `RequestHandler` subclasses in `source` are removed.
- The base `RequestHandler` class in `common/server/` is kept, as `dev/app` still relies on it.

## Solution

1. Update `HandlerConfig` to accept a `handler_executor_class` and instantiate it directly, bypassing `RequestHandler`.
2. Update `Router.js` in `source` to configure routes with executor classes instead of handler classes.
3. Delete all concrete `RequestHandler` subclasses from `source/lib/server/handlers/` and their specs.
4. Keep `source/lib/common/server/RequestHandler.js` and its spec intact.
5. Update `docs/agents` to reflect the removed handler classes and the updated routing pattern.

## Benefits

- Removes an entire layer of boilerplate classes from `source`.
- Simplifies the request path: `HandlerConfig` → `RequestHandlerExecutor` directly.
- Makes the codebase leaner and easier to understand.

---
See issue for details: https://github.com/darthjee/navi/issues/576

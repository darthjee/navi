# Plan: Configure Handlers Instead of Initialize Them

## Overview

Replace all eagerly-instantiated `RequestHandler` objects in `source/lib/server/Router.js` with a declarative route→config map and a new `HandlerConfig` class that lazily constructs the handler on each request.

## Context

- `Router.js` currently creates every handler instance at startup (`new SettingsRequestHandler(...)`, `new StatsRequestHandler()`, etc.).
- The issue asks for a config-first approach: routes map to `{ handler_class, parameters }` instead of pre-built instances.
- A new intermediary class reads the config and instantiates the real handler only when a request arrives, then delegates `handle(req, res)` to it.

## Implementation Steps

### Step 1 — Create `HandlerConfig`

Create `source/lib/server/HandlerConfig.js`. The class:
- Receives `handler_class` and `parameters` in its constructor.
- Exposes a `handle(req, res)` method that creates `new handler_class(parameters)` and calls `handle(req, res)` on it.

Add spec `source/spec/lib/server/HandlerConfig_spec.js` covering:
- That it instantiates the correct handler class with the given parameters.
- That it delegates `handle(req, res)` to the created handler.
- That a new handler instance is created on each call (lazy construction).

### Step 2 — Refactor `Router.js` to use config map

Replace all inline `new XxxRequestHandler(...)` instantiations with entries in a route config map:

```javascript
const GET_ROUTES = {
  '/settings.json': new HandlerConfig(SettingsRequestHandler, { enableShutdown: ... }),
  '/stats.json':    new HandlerConfig(StatsRequestHandler,    {}),
  // ...
};
```

Wire each route to its `HandlerConfig` instance so the router calls `handlerConfig.handle(req, res)`.

### Step 3 — Update documentation

Update `docs/agents/web-server.md` and `docs/agents/architecture.md` to document the `HandlerConfig` class and the config-map pattern in the router.

## Files to Change

- `source/lib/server/HandlerConfig.js` — **new** class
- `source/spec/lib/server/HandlerConfig_spec.js` — **new** spec
- `source/lib/server/Router.js` — replace eager handler instantiation with `HandlerConfig` entries
- `docs/agents/web-server.md` — document new pattern
- `docs/agents/architecture.md` — document `HandlerConfig` in server module

## Notes

- Exact structure of `Router.js` (how routes are currently wired) is not yet confirmed — needs codebase inspection.
- The name `HandlerConfig` is a suggestion; the actual name should follow existing conventions in the codebase.
- Each step should be its own atomic commit (implementation + tests together).

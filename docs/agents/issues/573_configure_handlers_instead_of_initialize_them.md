# Issue: Configure Handlers Instead of Initialize Them

## Description

Currently, `source/lib/server/Router.js` instantiates all `RequestHandler` objects eagerly at startup, before any request arrives. The goal is to replace those pre-initialized instances with a declarative configuration — a map of route → `{ handler_class, parameters }` — and introduce a new class that reads this configuration and lazily instantiates the handler at request time before delegating to it.

## Problem

- All `RequestHandler` instances are created at boot time in `Router.js`, even if some routes are rarely or never hit.
- The router mixes configuration (which handler handles which route) with object construction, making it harder to read and extend.
- Eager instantiation couples the router tightly to handler constructors and their arguments.

## Expected Behavior

- Routes are declared as a configuration map, e.g.:
  ```javascript
  const GET_ROUTES = {
    '/settings.json': { handler_class: SettingsRequestHandler, parameters: { enableShutdown: webConfig.enableShutdown } },
    '/stats.json':    { handler_class: StatsRequestHandler,    parameters: {} },
    // ...
  };
  ```
- A new class (e.g., `HandlerFactory` or `RouteHandlerConfig`) is initialized with `handler_class` and `parameters`. When a request arrives, this class instantiates the handler using those parameters and calls `handle(req, res)`.
- The router wires routes to instances of this new class rather than to pre-built handler instances.

## Solution

1. Define the route→config map in `Router.js` using `handler_class` and `parameters`.
2. Create a new class (e.g., `HandlerConfig`) that holds `handler_class` and `parameters` and implements a `handle(req, res)` method that constructs the handler on demand and delegates.
3. Replace all eager `new XxxRequestHandler(...)` calls in the router with `new HandlerConfig(XxxRequestHandler, parameters)`.
4. Add tests for the new `HandlerConfig` class.
5. Update `docs/agents` to document the new pattern.

## Benefits

- Cleaner separation between route configuration and handler instantiation.
- Handlers are constructed lazily, only when a matching request arrives.
- Easier to read and extend the router: adding a route is just adding an entry to a config map.

---
See issue for details: https://github.com/darthjee/navi/issues/573

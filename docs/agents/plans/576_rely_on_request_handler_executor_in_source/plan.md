# Plan: Rely on RequestHandlerExecutor in source

## Overview

Eliminate the `RequestHandler` middle layer from `source` by updating `HandlerConfig` to instantiate executor classes directly, then deleting all concrete `RequestHandler` subclasses and their specs from `source/lib/server/handlers/`.

## Context

- `HandlerConfig` (introduced in issue #573) currently holds a `handler_class` and instantiates a `RequestHandler` on each request, which in turn instantiates a `RequestHandlerExecutor`.
- All concrete `RequestHandler` subclasses in `source` (e.g., `IndexRequestHandler`, `StatsRequestHandler`, etc.) now do nothing beyond delegating to their executor — they are pure boilerplate.
- Removing them shortens the request path from `HandlerConfig` → `RequestHandler` → `RequestHandlerExecutor` to `HandlerConfig` → `RequestHandlerExecutor`.
- The base `RequestHandler` class in `common/server/` must be kept because `dev/app` still extends it.

## Implementation Steps

### Step 1 — Update `HandlerConfig` to accept executor classes

Change `HandlerConfig` to store a `handler_executor_class` (instead of `handler_class`) and instantiate the executor directly in its `handle(req, res)` method:

```javascript
handle(req, res) {
  new this.#handlerExecutorClass(req, res, ...this.#parameters).handle();
}
```

Update the `HandlerConfig` spec to reflect the new contract.

### Step 2 — Update `Router.js` to use executor classes

Replace every `new HandlerConfig(XxxRequestHandler, params)` entry in the route config map with `new HandlerConfig(XxxHandlerExecutor, params)`, importing executors directly instead of handlers.

### Step 3 — Delete concrete `RequestHandler` subclasses from `source`

Remove all files under `source/lib/server/handlers/` that are concrete `RequestHandler` subclasses (e.g., `IndexRequestHandler.js`, `LinksRequestHandler.js`, `SettingsRequestHandler.js`, `LogsRequestHandler.js`, `StatsRequestHandler.js`, `AssetsRequestHandler.js`, and all engine/job handler files). Delete their corresponding spec files as well.

Do **not** delete:
- `source/lib/common/server/RequestHandler.js` (base class, still used by `dev/app`)
- `source/spec/lib/common/server/RequestHandler_spec.js`
- Any executor classes or their specs

### Step 4 — Update documentation

Update `docs/agents/architecture.md` and `docs/agents/web-server.md` to reflect:
- Removal of concrete `RequestHandler` subclasses from `source`.
- The updated `HandlerConfig` contract (executor class + parameters).

## Files to Change

- `source/lib/server/HandlerConfig.js` — accept executor class, instantiate executor directly
- `source/spec/lib/server/HandlerConfig_spec.js` — update tests for new contract
- `source/lib/server/Router.js` — switch to executor classes in route config
- `source/lib/server/handlers/*.js` — **delete** all concrete RequestHandler subclasses
- `source/lib/server/handlers/engine/*.js` — **delete** all engine RequestHandler subclasses
- `source/lib/server/handlers/jobs/*.js` — **delete** all job RequestHandler subclasses
- `source/spec/lib/server/handlers/*_spec.js` — **delete** corresponding specs
- `source/spec/lib/server/handlers/engine/*_spec.js` — **delete**
- `source/spec/lib/server/handlers/jobs/*_spec.js` — **delete** handler specs (keep executor specs)
- `docs/agents/architecture.md` — update server module description
- `docs/agents/web-server.md` — update routing pattern docs

## Notes

- Exact signature of `HandlerConfig` constructor and how parameters are passed to executors is not yet confirmed — needs codebase inspection to match the existing executor constructor signatures.
- Engine and job executor constructors vary (some take `pageSize`, some take nothing beyond `req/res`) — `HandlerConfig` must handle this correctly.
- Each step should be its own atomic commit (implementation + tests together).

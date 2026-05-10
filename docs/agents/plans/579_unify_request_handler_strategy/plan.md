# Plan: Unify Request Handler Strategy

## Overview

Update `dev/app` to use `HandlerConfig` with executor classes directly, eliminating the concrete `RequestHandler` subclasses (`IndexRequestHandler`, `ContentHandler`, `CollectionHandler`, `RedirectHandler`). Once no subclasses remain anywhere, the base `RequestHandler` class can be removed entirely.

## Context

After issue #576, `source` no longer uses `RequestHandler` subclasses — it wires `HandlerConfig` directly to `RequestHandlerExecutor` subclasses. `dev/app` still uses the old pattern: `Router.js` instantiates `RequestHandler` subclasses that in turn instantiate executors. The goal is to apply the same unified strategy to `dev/app`.

One prerequisite: `HandlerConfig` currently lives in `source/lib/server/HandlerConfig.js`, which is **not** in the Docker-mounted `common` folder. It must be moved to `source/lib/common/server/HandlerConfig.js` so that `dev/app` can import it via `../common/server/HandlerConfig.js`.

A second prerequisite: the `extractorFactory` default (`(r, params) => new RouteParamsExtractor(r, params)`) currently lives in `ContentHandler`. When `HandlerConfig` is used, there is no `ContentHandler` to apply the default — so the default must be moved into `ContentHandlerExecutor`'s constructor.

## Implementation Steps

### Step 1 — Move `HandlerConfig` to `common/server/`

Move `source/lib/server/HandlerConfig.js` → `source/lib/common/server/HandlerConfig.js` and update the corresponding spec. Update all existing `source` imports (in `Router.js` and any handler files) to reflect the new path. This makes `HandlerConfig` available in both `source` and `dev/app` through the shared Docker volume.

### Step 2 — Move `extractorFactory` default into `ContentHandlerExecutor`

Add a default value for `extractorFactory` in `ContentHandlerExecutor`'s constructor: `extractorFactory = (r, params) => new RouteParamsExtractor(r, params)`. Import `RouteParamsExtractor` into `ContentHandlerExecutor`. This allows `HandlerConfig` to omit the factory when calling the executor with `[route, data, serializer]`.

### Step 3 — Update `dev/app/lib/routing/Router.js`

Replace all `RequestHandler` subclass usages with `HandlerConfig` + executor class:

| Before | After |
|---|---|
| `new ContentHandler(route, data, serializer)` | `new HandlerConfig(ContentHandlerExecutor, [route, data, serializer])` |
| `new CollectionHandler(route, data, serializer)` | `new HandlerConfig(CollectionHandlerExecutor, [route, data, serializer])` |
| `new RedirectHandler(target)` | `new HandlerConfig(RedirectHandlerExecutor, [target])` |
| `new IndexRequestHandler().handle(_req, res)` | `new HandlerConfig(IndexHandlerExecutor).handle(_req, res)` |

Update imports accordingly.

### Step 4 — Delete concrete `RequestHandler` subclasses from `dev/app`

Delete the following files (they become dead code):
- `dev/app/lib/handlers/IndexRequestHandler.js`
- `dev/app/lib/handlers/ContentHandler.js`
- `dev/app/lib/handlers/CollectionHandler.js`
- `dev/app/lib/handlers/RedirectHandler.js`
- `dev/app/spec/lib/handlers/IndexRequestHandler_spec.js`
- `dev/app/spec/lib/handlers/ContentHandler_spec.js`
- `dev/app/spec/lib/handlers/CollectionHandler_spec.js`
- `dev/app/spec/lib/handlers/RedirectHandler_spec.js`

### Step 5 — Remove the base `RequestHandler` class

With no concrete subclasses remaining in either `source` or `dev/app`, remove:
- `source/lib/common/server/RequestHandler.js`
- `source/spec/lib/common/server/RequestHandler_spec.js`

### Step 6 — Update `RouteRegister.js` JSDoc

The JSDoc comment in `dev/app/lib/routing/RouteRegister.js` currently references `RequestHandler` subclass instances. Update it to reflect that any object with a `handle(req, res)` method (including `HandlerConfig`) is accepted.

## Files to Change

- `source/lib/server/HandlerConfig.js` → moved to `source/lib/common/server/HandlerConfig.js`
- `source/spec/lib/server/HandlerConfig_spec.js` → moved to `source/spec/lib/common/server/HandlerConfig_spec.js`
- `source/lib/server/Router.js` — update `HandlerConfig` import path
- Any other `source` file importing `HandlerConfig` — update import path
- `dev/app/lib/handlers/ContentHandlerExecutor.js` — add default `extractorFactory`, import `RouteParamsExtractor`
- `dev/app/spec/lib/handlers/ContentHandlerExecutor_spec.js` — add test for default extractor factory
- `dev/app/lib/routing/Router.js` — switch to `HandlerConfig` + executor classes
- `dev/app/lib/routing/RouteRegister.js` — update JSDoc
- `dev/app/lib/handlers/IndexRequestHandler.js` — deleted
- `dev/app/lib/handlers/ContentHandler.js` — deleted
- `dev/app/lib/handlers/CollectionHandler.js` — deleted
- `dev/app/lib/handlers/RedirectHandler.js` — deleted
- `dev/app/spec/lib/handlers/IndexRequestHandler_spec.js` — deleted
- `dev/app/spec/lib/handlers/ContentHandler_spec.js` — deleted
- `dev/app/spec/lib/handlers/CollectionHandler_spec.js` — deleted
- `dev/app/spec/lib/handlers/RedirectHandler_spec.js` — deleted
- `source/lib/common/server/RequestHandler.js` — deleted
- `source/spec/lib/common/server/RequestHandler_spec.js` — deleted

## CI Checks

Before opening a PR, run the following checks for the folders being modified:

- `source`: `cd source && npm run coverage` (CircleCI job: `jasmine`)
- `source`: `cd source && npm run lint` (CircleCI job: `checks`)
- `dev/app`: `cd dev/app && npm run coverage` (CircleCI job: `jasmine-dev`)
- `dev/app`: `cd dev/app && npm run lint` (CircleCI job: `checks-dev`)

## Notes

- Each step should be its own commit.
- `CollectionHandlerExecutor` inherits from `ContentHandlerExecutor`, so the `extractorFactory` default flows through automatically.
- `HandlerConfig` in `source/lib/server/Router.js` currently imports from `'./HandlerConfig.js'` — after the move, all source imports should use `'../common/server/HandlerConfig.js'`.

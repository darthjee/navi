# Plan: Refactor Dev Container Code

## Overview

Refactor `dev/lib/` to introduce three new classes — `Serializer`, `RequestHandler`, and `RouteRegister` (renamed from `RouteRegistrar`) — that together replace the mixed approach in `Router.js` with a clean, uniform route registration pipeline.

## Context

`dev/lib/Router.js` currently mixes two approaches:
- `/categories/:id/items.json` and `/categories/:id/items/:item_id.json` are registered via `RouteRegistrar`.
- `/categories.json` and `/categories/:id.json` are defined inline because they need field projection (`{ id, name }` only) that `RouteRegistrar` cannot express.

The goal is a four-layer design:
1. **`Serializer`** — given a list of `attributes`, projects an object (or recursively maps an array) to only those fields.
2. **`RequestHandler`** — constructed with `route`, `data`, and an optional `Serializer`; runs `RouteParamsExtractor` → `DataNavigator`, serializes the result, and writes the HTTP response.
3. **`RouteRegister`** — thin wrapper holding `router` + `data`; accepts `{ route, attributes }` and wires everything together.
4. **`Router`** — only calls `register(...)` for every route; no inline handler logic.

## Implementation Steps

### Step 1 — Create `Serializer`

Create `dev/lib/Serializer.js`:

```js
class Serializer {
  constructor(attributes) {
    this._attributes = attributes;
  }

  /**
   * Projects the given data to the configured attributes.
   * If data is an array, maps each element recursively.
   * @param {Object|Array} data
   * @returns {Object|Array}
   */
  serialize(data) {
    if (Array.isArray(data)) {
      return data.map((item) => this.serialize(item));
    }
    return Object.fromEntries(
      this._attributes.map((attr) => [attr, data[attr]])
    );
  }
}

export default Serializer;
```

### Step 2 — Create spec for `Serializer`

Create `dev/spec/lib/Serializer_spec.js` covering:
- Serializing a single object returns only the specified attributes.
- Serializing an array maps each element, returning only the specified attributes.

### Step 3 — Create `RequestHandler`

Create `dev/lib/RequestHandler.js`:

```js
import DataNavigator from './DataNavigator.js';
import { notFound } from './not_found.js';
import RouteParamsExtractor from './RouteParamsExtractor.js';

class RequestHandler {
  constructor(route, data, serializer = null) {
    this._route = route;
    this._data = data;
    this._serializer = serializer;
  }

  /**
   * Navigates the data for the given route/params, serializes the result,
   * and writes the JSON response. Responds 404 if navigation returns null.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  handle(req, res) {
    const steps = new RouteParamsExtractor(this._route, req.params).steps();
    const result = new DataNavigator(this._data, steps).navigate();
    if (result === null) return notFound(res);
    res.json(this._serializer ? this._serializer.serialize(result) : result);
  }
}

export default RequestHandler;
```

`RequestHandler` is instantiated once per route at registration time and reused across requests.

### Step 4 — Create spec for `RequestHandler`

Create `dev/spec/lib/RequestHandler_spec.js` covering:
- A route without a serializer returns the raw navigation result as JSON.
- A route with a serializer returns the projected result.
- A route that navigates to `null` returns a 404.

Follow the same test structure used in `RouteRegistrar_spec.js` (supertest + fixture data).

### Step 5 — Rename `RouteRegistrar` → `RouteRegister` and delegate to `RequestHandler`

Rename `dev/lib/RouteRegistrar.js` → `dev/lib/RouteRegister.js`:

```js
import RequestHandler from './RequestHandler.js';
import Serializer from './Serializer.js';

class RouteRegister {
  constructor(router, data) {
    this._router = router;
    this._data = data;
  }

  /**
   * Registers a GET route.
   * @param {string} route - Express route pattern
   * @param {string[]} [attributes] - If provided, response is projected to these fields
   */
  register({ route, attributes } = {}) {
    const serializer = attributes ? new Serializer(attributes) : null;
    const handler = new RequestHandler(route, this._data, serializer);
    this._router.get(route, (req, res) => handler.handle(req, res));
  }
}

export default RouteRegister;
```

### Step 6 — Update `RouteRegistrar_spec.js` → `RouteRegister_spec.js`

Rename `dev/spec/lib/RouteRegistrar_spec.js` → `dev/spec/lib/RouteRegister_spec.js` and update all imports and `describe` labels to use `RouteRegister`. Add cases covering `attributes` projection.

### Step 7 — Refactor `Router.js` to use `RouteRegister` for all routes

```js
import { Router as ExpressRouter } from 'express';
import RouteRegister from './RouteRegister.js';

class Router {
  constructor(data) {
    this._data = data;
  }

  build() {
    const router = ExpressRouter();
    const register = new RouteRegister(router, this._data);

    register.register({ route: '/categories.json', attributes: ['id', 'name'] });
    register.register({ route: '/categories/:id.json', attributes: ['id', 'name'] });
    register.register({ route: '/categories/:id/items.json' });
    register.register({ route: '/categories/:id/items/:item_id.json' });

    return router;
  }
}

export default Router;
```

No `RouteParamsExtractor`, `DataNavigator`, `notFound`, or `RouteRegistrar` imports needed in `Router.js`.

## Files to Change

| File | Change |
|------|--------|
| `dev/lib/Serializer.js` | **Create** — projects data to specified attributes, handles arrays recursively |
| `dev/spec/lib/Serializer_spec.js` | **Create** — unit tests for `Serializer` |
| `dev/lib/RequestHandler.js` | **Create** — owns request-handling logic, uses optional `Serializer` |
| `dev/spec/lib/RequestHandler_spec.js` | **Create** — integration tests for `RequestHandler` |
| `dev/lib/RouteRegistrar.js` | **Rename → `RouteRegister.js`**, accept `{ route, attributes }`, delegate to `RequestHandler` + `Serializer` |
| `dev/spec/lib/RouteRegistrar_spec.js` | **Rename → `RouteRegister_spec.js`**, update imports, labels, and add attributes cases |
| `dev/lib/Router.js` | **Update** — replace inline handlers with `register` calls using `{ route, attributes }` |

## Notes

- `Router_spec.js` does not need changes — it tests HTTP endpoints, which remain identical.
- `Serializer` has no Express dependency and can be tested with plain objects.
- `RequestHandler` is instantiated once per route at registration time, not per-request.
- Routes without `attributes` (items routes) return the raw navigation result unchanged.

# Dev Application

The dev application is a sample JSON API used as the target backend when developing and testing Navi (the cache-warmer). It provides a small, predictable dataset so that Navi's HTTP requests, proxy interactions, and caching behaviour can be verified in a controlled environment.

---

## Overview

Navi is configured to warm a cache by issuing HTTP requests to a backend through a reverse proxy (`navi_proxy`, powered by [tent](https://github.com/darthjee/tent)). The dev application is that backend. It exposes a simple categories-and-items REST API. Navi reads a YAML config that lists these endpoints as resources to warm, issues the requests, and the proxy caches the responses.

```
navi_app ──► navi_proxy (tent, :3010) ──► navi_dev_app (:3020/:80)
```

---

## `dev/` — Express/Node.js application

### Structure

```
dev/
├── server.js             # Entrypoint (script) — loads data.yml and calls app.listen(80)
├── app.js                # App module — builds and exports the configured Express app
├── data.yml              # Data source: categories and items
├── package.json
├── eslint.config.mjs
├── yarn.lock
├── lib/
│   ├── DataNavigator.js      # Traverses the in-memory data structure
│   ├── RequestHandler.js     # Handles a single Express request
│   ├── RouteParamsExtractor.js # Converts route + params into navigation steps
│   ├── RouteRegister.js      # Registers a single GET route on the router
│   ├── Router.js             # Builds the Express router with all routes
│   ├── Serializer.js         # Projects data objects to a set of allowed attributes
│   └── not_found.js          # Helper that sends a 404 JSON response
└── spec/
    ├── app_spec.js
    ├── lib/
    │   ├── DataNavigator_spec.js
    │   ├── RequestHandler_spec.js
    │   ├── RouteParamsExtractor_spec.js
    │   ├── RouteRegister_spec.js
    │   ├── Router_spec.js
    │   └── Serializer_spec.js
    └── support/
        ├── fixtures/data.yml
        └── utils/FixturesUtils.js
```

### Backend

**Stack:** Node.js (ES Modules), Express 4, js-yaml

**Server launcher (entrypoint):** `server.js` — reads `data.yml` (or a path from `process.argv[2]`), parses it with js-yaml, builds the app, and calls `app.listen(80)`. This is the only file in `dev/` that acts as a script.

**App module:** `app.js` — exports `buildApp(data)`, which constructs the Express application with all routes registered and a catch-all 404 handler. Imported by both `server.js` and the test suite.

**Data loading:** `data.yml` is read once at startup with `readFileSync` and parsed with `js-yaml`. The result is kept in memory for the lifetime of the process.

### Classes and modules

#### `lib/Router`

Builds and returns the configured Express router with all application routes registered.

| Method | Description |
|--------|-------------|
| `constructor(data)` | Receives the parsed YAML data. |
| `build()` | Creates an Express router, registers all routes via `RouteRegister`, and returns it. |

#### `lib/RouteRegister`

Registers individual GET routes on an Express router, wiring each route to a `RequestHandler` and an optional `Serializer`.

| Method | Description |
|--------|-------------|
| `constructor(router, data)` | Receives the Express router and the root data structure. |
| `register({ route, attributes })` | Registers a GET handler; if `attributes` is provided, a `Serializer` is created to project the response. |

#### `lib/RequestHandler`

Handles an incoming Express request by navigating the in-memory data, optionally serializing the result, and writing the JSON response.

| Method | Description |
|--------|-------------|
| `constructor(route, data, serializer?)` | Receives the route pattern, root data, and an optional `Serializer`. |
| `handle(req, res)` | Extracts navigation steps, navigates the data, and responds with JSON (or 404 if nothing was found). |

#### `lib/RouteParamsExtractor`

Converts an Express route pattern and its resolved params into the ordered steps array expected by `DataNavigator`.

| Method | Description |
|--------|-------------|
| `constructor(route, params)` | Receives the route pattern and the `req.params` object. |
| `steps()` | Returns `Array<string\|number>` — string segments become object-key steps; `:param` segments become numeric ID steps. |

#### `lib/DataNavigator`

Traverses a nested data structure by following a sequence of steps. Numeric steps perform an `Array#find` by `id`; string steps access an object key.

| Method | Description |
|--------|-------------|
| `constructor(data, steps)` | Receives the root data structure and the steps array. |
| `navigate()` | Walks the data following `steps` and returns the reached value, or `null` if any step yields nothing. |

#### `lib/Serializer`

Projects a data object (or array of objects) to a defined set of attributes, stripping any fields not in the allowlist.

| Method | Description |
|--------|-------------|
| `constructor(attributes)` | Receives the list of attribute names to keep. |
| `serialize(data)` | Returns a projected object or array; arrays are mapped recursively. |

#### `lib/not_found`

Utility function: `notFound(res)` — sends a 404 response with `{ "error": "Not found" }`.

### Routes

All routes are registered in `Router#build()` via `RouteRegister#register()`:

| Method | Path | Description | Response |
|--------|------|-------------|----------|
| GET | `/categories.json` | List all categories | `[{id, name}, …]` |
| GET | `/categories/:id.json` | Single category by ID | `{id, name}` or 404 |
| GET | `/categories/:id/items.json` | All items in a category | `[{id, name}, …]` or 404 |
| GET | `/categories/:id/items/:item_id.json` | Single item | `{id, name}` or 404 |
| `*` | `/*` | Catch-all | `{error: "Not found"}` 404 |

All responses are JSON. Errors return `{"error": "Not found"}` with status 404.

### Request lifecycle

1. Express matches the incoming path against the registered routes (top to bottom).
2. `RouteParamsExtractor` converts the route pattern and `req.params` into a steps array.
3. `DataNavigator` follows the steps through the in-memory data.
4. If no matching record is found, `notFound(res)` responds with 404.
5. Otherwise, the result is optionally projected by `Serializer` and returned as JSON.
6. The catch-all `app.use` at the bottom handles any path that matched no route.

### Data (`data.yml`)

Three categories, each with three items:

| Category | Items |
|----------|-------|
| Books (1) | The Hobbit, The Lord of the Rings, The Silmarillion |
| Movies (2) | The Shawshank Redemption, The Godfather, The Dark Knight |
| Music (3) | The Beatles, Nirvana, Queen |

### How to add a new endpoint

1. Add the data to `data.yml` under the appropriate key.
2. Call `register.register(…)` in `Router#build()` before returning the router.
3. Write a corresponding `describe` block in `spec/lib/Router_spec.js` and in `spec/app_spec.js` covering the happy path and the 404 case.

---

## Testing

**Framework:** Jasmine 5 + Supertest 7

Tests live in `spec/`. They import the Express app (or individual classes) directly and use Supertest to issue HTTP requests in-process — no running server is required.

### Test files

| File | What it covers |
|------|---------------|
| `spec/app_spec.js` | End-to-end route tests through the full app |
| `spec/lib/Router_spec.js` | All routes registered by `Router#build()` |
| `spec/lib/RouteRegister_spec.js` | Route registration and serializer wiring |
| `spec/lib/RequestHandler_spec.js` | Data navigation, serialization, and 404 handling |
| `spec/lib/RouteParamsExtractor_spec.js` | Steps extraction from route patterns and params |
| `spec/lib/DataNavigator_spec.js` | Navigation through nested data structures |
| `spec/lib/Serializer_spec.js` | Attribute projection for objects and arrays |

### Running tests

Inside the `dev/` directory:

```bash
yarn test       # Run tests with c8 coverage (text + HTML)
yarn coverage   # Run tests and produce coverage/lcov.info (for CI)
yarn lint       # ESLint
yarn report     # JSCPD duplication analysis
```

---

## CI

| Job | Directory | What it does |
|-----|-----------|-------------|
| `jasmine` | `source/` | Runs Navi's own tests + uploads coverage to Codacy (partial) |
| `checks` | `source/` | ESLint + JSCPD |
| `jasmine-dev` | `dev/` | Runs dev-app tests + uploads coverage to Codacy (partial) |
| `checks-dev` | `dev/` | ESLint + JSCPD |
| `coverage-final` | — | Sends the Codacy `final` signal after both partial uploads complete |

`jasmine-dev` and `checks-dev` mirror the structure of `jasmine` and `checks`. `coverage-final` depends on both `jasmine` and `jasmine-dev` so Codacy receives a combined coverage report from both applications.

All jobs run on every push and every tag. There are no branch restrictions on the test jobs.

---

## Docker Compose

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| `navi_dev_app` | `navi_app:dev` | `3020:80` | Runs the Express dev app from `dev/` |
| `navi_proxy` | `darthjee/tent:0.5.0` | `3010:80` | Reverse-proxy + caching layer in front of `navi_dev_app` |
| `navi_app` | `navi:dev` | — | Navi application container; linked to `navi_proxy` as `remote_host` |
| `navi_tests` | `navi:dev` | — | Test/lint container for `source/` |

### Dependency chain

```
navi_app ──depends_on──► navi_proxy ──depends_on──► navi_dev_app
navi_tests ──depends_on──► base_build
```

### Environment variables

The services use an `.env` file (copied from `.env.sample` during `make setup`). No dev-app-specific environment variables are required beyond what the base image provides.

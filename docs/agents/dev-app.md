# Dev Application

The dev application is a sample JSON API used as the target backend when developing and testing Navi (the cache-warmer). It provides a small, predictable dataset so that Navi's HTTP requests, proxy interactions, and caching behaviour can be verified in a controlled environment.

---

## Overview

Navi is configured to warm a cache by issuing HTTP requests to a backend through a reverse proxy (`navi_proxy`, powered by [tent](https://github.com/darthjee/tent)). The dev application is that backend. It exposes a simple categories-and-items REST API. Navi reads a YAML config that lists these endpoints as resources to warm, issues the requests, and the proxy caches the responses.

```
navi_app ──► navi_proxy (tent, :3010) ──► navi_dev_app (:3020/:80)
```

---

## `dev/app/` — Express/Node.js application

### Structure

```
dev/app/
├── server.js             # Entrypoint (script) — loads data.yml and calls app.listen(80)
├── app.js                # App module — builds and exports the configured Express app
├── data.yml              # Data source: categories and items
├── package.json
├── eslint.config.mjs
├── yarn.lock
├── lib/
│   ├── DataNavigator.js      # Traverses the in-memory data structure
│   ├── RedirectHandler.js    # Issues HTTP 302 redirects to hash-based frontend routes
│   ├── RedirectLocation.js   # Builds the redirect location URL from a template and params
│   ├── RedirectRegister.js   # Registers redirect GET routes on the router
│   ├── RequestHandler.js     # Handles a single Express request
│   ├── RouteParamsExtractor.js # Converts route + params into navigation steps
│   ├── RouteRegister.js      # Registers a single GET route on the router
│   ├── Router.js             # Builds the Express router with all routes
│   ├── Serializer.js         # Projects data objects to a set of allowed attributes
│   ├── not_found.js          # Helper that sends a 404 JSON response
│   ├── redirect_routes.config.js # Redirect route definitions (plain path → hash SPA)
│   └── routes.config.js      # JSON API route definitions
└── spec/
    ├── app_spec.js
    ├── lib/
    │   ├── DataNavigator_spec.js
    │   ├── RedirectHandler_spec.js
    │   ├── RedirectLocation_spec.js
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

**Server launcher (entrypoint):** `server.js` — reads `data.yml` (or a path from `process.argv[2]`), parses it with js-yaml, builds the app, and calls `app.listen(80)`. This is the only file in `dev/app/` that acts as a script.

**App module:** `app.js` — exports `buildApp(data)`, which constructs the Express application with all routes registered and a catch-all 404 handler. Imported by both `server.js` and the test suite.

**Data loading:** `data.yml` is read once at startup with `readFileSync` and parsed with `js-yaml`. The result is kept in memory for the lifetime of the process.

### Classes and modules

#### `lib/Router`

Builds and returns the configured Express router with all application routes registered.

| Method | Description |
|--------|-------------|
| `constructor(data)` | Receives the parsed YAML data. |
| `build()` | Creates an Express router, registers redirect routes via `RedirectRegister` (before JSON routes), registers JSON routes via `RouteRegister`, and returns it. |

#### `lib/RedirectRegister`

Registers individual GET redirect routes on an Express router, wiring each route to a `RedirectHandler` that issues an HTTP 302 to the target URL.

| Method | Description |
|--------|-------------|
| `constructor(router)` | Receives the Express router. |
| `register({ route, target })` | Registers a GET redirect handler for `route`; `target` is the hash-based URL template. |

#### `lib/RedirectHandler`

Handles an incoming Express request by issuing an HTTP 302 redirect to the hash-based equivalent path, delegating URL construction to `RedirectLocation`.

| Method | Description |
|--------|-------------|
| `constructor(target)` | Receives the hash-based redirect target template (e.g. `'/#/categories/:id'`). |
| `handle(req, res)` | Builds the redirect location via `RedirectLocation` and responds with 302. |

#### `lib/RedirectLocation`

Builds a redirect location URL by substituting route parameter values into a hash-based target template. Each parameter value is URI-encoded to prevent injection.

| Method | Description |
|--------|-------------|
| `constructor(target, params)` | Receives the target template and the params object (`req.params`). |
| `build()` | Returns the resolved location string with all named segments replaced. |

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

All routes are registered in `Router#build()`. Redirect routes are registered via `RedirectRegister#register()` before JSON routes:

| Method | Path | Description | Response |
|--------|------|-------------|----------|
| GET | `/categories` | Redirect to hash SPA route | 302 → `/#/categories` |
| GET | `/categories/:id` | Redirect to hash SPA route | 302 → `/#/categories/:id` |
| GET | `/categories/:id/items` | Redirect to hash SPA route | 302 → `/#/categories/:id/items` |
| GET | `/categories/:categoryId/items/:id` | Redirect to hash SPA route | 302 → `/#/categories/:categoryId/items/:id` |
| GET | `/categories.json` | List all categories | `[{id, name}, …]` |
| GET | `/categories/:id.json` | Single category by ID | `{id, name}` or 404 |
| GET | `/categories/:id/items.json` | All items in a category | `[{id, name}, …]` or 404 |
| GET | `/categories/:id/items/:item_id.json` | Single item | `{id, name}` or 404 |
| `*` | `/*` | Catch-all | `{error: "Not found"}` 404 |

All JSON responses return `{"error": "Not found"}` with status 404 when the resource is not found.

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
| `spec/lib/RedirectHandler_spec.js` | Redirect URL building and 302 response |
| `spec/lib/RedirectLocation_spec.js` | Location URL construction from template and params |
| `spec/lib/RequestHandler_spec.js` | Data navigation, serialization, and 404 handling |
| `spec/lib/RouteParamsExtractor_spec.js` | Steps extraction from route patterns and params |
| `spec/lib/DataNavigator_spec.js` | Navigation through nested data structures |
| `spec/lib/Serializer_spec.js` | Attribute projection for objects and arrays |

### Running tests

Inside the `dev/app/` directory:

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
| `jasmine-dev` | `dev/app/` | Runs dev-app tests + uploads coverage to Codacy (partial) |
| `checks-dev` | `dev/app/` | ESLint + JSCPD |
| `jasmine-dev-frontend` | `dev/frontend/` | Runs dev-frontend tests + uploads coverage to Codacy (partial) |
| `checks-dev-frontend` | `dev/frontend/` | ESLint + JSCPD |
| `coverage-final` | — | Sends the Codacy `final` signal after all partial uploads complete |

`coverage-final` depends on `jasmine`, `jasmine-dev`, `jasmine-dev-frontend`, and `jasmine-frontend` so Codacy receives a combined coverage report from all four test suites (main application, dev backend, dev frontend, and main frontend).

All jobs run on every push and every tag. There are no branch restrictions on the test jobs.

---

## `dev/frontend/` — React + Vite frontend application

### Overview

`dev/frontend/` is a React single-page application (SPA) that provides a browser UI for browsing the categories and items served by `dev/app/`. It is built with Vite and served as static assets through `navi_proxy`.

### Structure

```
dev/frontend/
├── index.html
├── package.json
├── eslint.config.mjs
├── vite.config.js
├── yarn.lock
├── src/
│   ├── App.jsx                  # Root component with HashRouter + Routes
│   ├── main.jsx                 # Entry point — mounts App into #root
│   ├── clients/
│   │   ├── CategoriesClient.js  # fetch wrappers for /categories*.json
│   │   └── ItemsClient.js       # fetch wrappers for /categories/:id/items*.json
│   ├── pages/
│   │   ├── IndexPage.jsx
│   │   ├── CategoriesIndexPage.jsx
│   │   ├── CategoryPage.jsx
│   │   ├── CategoryItemsIndexPage.jsx
│   │   └── CategoryItemPage.jsx
│   └── styles/
│       └── main.css             # Imports Bootstrap CSS
└── spec/
    ├── clients/
    │   ├── CategoriesClient_spec.js
    │   └── ItemsClient_spec.js
    ├── pages/
    │   ├── IndexPage_spec.js
    │   ├── CategoriesIndexPage_spec.js
    │   ├── CategoryPage_spec.js
    │   ├── CategoryItemsIndexPage_spec.js
    │   └── CategoryItemPage_spec.js
    └── support/
        ├── jasmine.json         # Jasmine config — loads dom.js helper
        ├── dom.js               # Sets up jsdom globals for Node.js
        ├── loader.js            # Registers ESM transform hook
        └── transform_hooks.js   # esbuild-powered JSX transform hook
```

### Routes

| Path | Component |
|------|-----------|
| `/#/` | `IndexPage` |
| `/#/categories` | `CategoriesIndexPage` |
| `/#/categories/:id` | `CategoryPage` |
| `/#/categories/:id/items` | `CategoryItemsIndexPage` |
| `/#/categories/:categoryId/items/:id` | `CategoryItemPage` |

### Build and serving

The frontend is built with `yarn build` (Vite) and the output lands in `dev/proxy/static/` (mounted into the proxy container). The proxy serves static files for non-`.json` requests and falls back to `index.html` for SPA routing.

### Running tests

Inside the `dev/frontend/` directory:

```bash
yarn test       # Run tests with c8 coverage (text + HTML)
yarn coverage   # Run tests and produce coverage/lcov.info (for CI)
yarn lint       # ESLint
yarn report     # JSCPD duplication analysis
```

---

## Docker Compose

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| `navi_dev_app` | `navi_app:dev` | `3020:80` | Runs the Express dev app from `dev/app/` |
| `navi_dev_frontend` | `navi_dev_frontend:dev` | — | Builds the React SPA from `dev/frontend/` into `dev/proxy/static/` |
| `navi_proxy` | `darthjee/tent:0.5.0` | `3010:80` | Reverse-proxy + caching layer in front of `navi_dev_app`; serves the built frontend static files |
| `navi_app` | `navi:dev` | — | Navi application container; linked to `navi_proxy` as `remote_host` |
| `navi_tests` | `navi:dev` | — | Test/lint container for `source/` |

### Dependency chain

```
navi_app ──depends_on──► navi_proxy ──depends_on──► navi_dev_app
                                     ──depends_on──► navi_dev_frontend
navi_tests ──depends_on──► base_build
```

### Environment variables

The services use an `.env` file (copied from `.env.sample` during `make setup`). No dev-app-specific environment variables are required beyond what the base image provides.

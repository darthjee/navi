# Dev Application

The dev application is a sample JSON API used as the target backend when developing and testing Navi. It provides a small, predictable dataset so that Navi's HTTP requests and caching behaviour can be verified in a controlled environment.

```
navi_app ──► navi_proxy (tent, :3010) ──► navi_dev_app (:3020/:80)
```

---

## `dev/app/` — Express/Node.js application

**Stack:** Node.js (ES Modules), Express 4, js-yaml

**Entrypoint:** `server.js` reads `data.yml`, builds the Express app, and starts listening on port 80. `app.js` exports `buildApp(data)` and is imported by both `server.js` and the test suite.

### Structure

```
dev/app/
├── server.js             # Entrypoint — loads data.yml and calls app.listen(80)
├── app.js                # App module — exports buildApp(data)
├── data.yml              # Data source: categories and items
├── lib/
│   ├── config/
│   │   ├── AppConfig.js        # Loads and exposes app configuration
│   │   └── JsonConfig.js       # Wraps raw JSON/YAML config data
│   ├── handlers/
│   │   ├── CollectionHandler.js    # Lists all items in a category
│   │   ├── ContentHandler.js       # Data-fetching handler (extends RequestHandler)
│   │   ├── IndexRequestHandler.js  # Serves the SPA index.html
│   │   ├── RedirectHandler.js      # Issues HTTP 302 to hash-based SPA routes
│   │   ├── RequestHandler.js       # Abstract base class defining handle(req, res)
│   │   └── not_found.js            # Sends a 404 JSON response
│   ├── models/
│   │   ├── DataNavigator.js        # Traverses the in-memory data structure by steps
│   │   ├── FailureSimulator.js     # Simulates configurable request failures
│   │   ├── RedirectLocation.js     # Builds redirect location from template + params
│   │   └── Serializer.js           # Projects data objects to a set of allowed attributes
│   ├── routing/
│   │   ├── RouteParamsExtractor.js # Converts route + params into navigation steps
│   │   ├── RouteRegister.js        # Registers any RequestHandler subclass on the router
│   │   ├── Router.js               # Builds Express router with all routes registered
│   │   ├── redirect_routes.config.js # Redirect route definitions
│   │   └── routes.config.js        # JSON API route definitions
│   ├── common/                     # Mounted from source/lib/common
│   │   └── utils/
│   │       ├── EnvResolver.js
│   │       ├── env_resolver/EnvStringResolver.js
│   │       └── logging/
└── spec/
```

`ContentHandler` navigates the in-memory data via `DataNavigator` (following steps from `RouteParamsExtractor`), optionally serializes the result with `Serializer`, and responds with JSON or 404. `RedirectHandler` delegates URL construction to `RedirectLocation`.

### Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/categories` | 302 → `/#/categories` |
| GET | `/categories/:id` | 302 → `/#/categories/:id` |
| GET | `/categories/:id/items` | 302 → `/#/categories/:id/items` |
| GET | `/categories/:id/items/:item_id` | 302 → hash SPA route |
| GET | `/categories.json` | List all categories `[{id, name}, …]` |
| GET | `/categories/:id.json` | Single category or 404 |
| GET | `/categories/:id/items.json` | Items in a category or 404 |
| GET | `/categories/:id/items/:item_id.json` | Single item or 404 |
| `*` | `/*` | 404 `{error: "Not found"}` |

### Data (`data.yml`)

Three categories (Books, Movies, Music), each with three items. Data is loaded once at startup and kept in memory.

---

## Testing

**Framework:** Jasmine 5 + Supertest 7. Tests import the Express app directly; no running server required.

```bash
yarn test       # Run tests with c8 coverage
yarn coverage   # Run tests and produce lcov.info (for CI)
yarn lint       # ESLint
yarn report     # JSCPD duplication analysis
```

---

## `dev/frontend/` — React + Vite SPA

A browser UI for browsing the categories and items served by `dev/app/`. Built with Vite; output lands in `dev/proxy/static/` for the proxy to serve.

| Path | Component |
|------|-----------|
| `/#/` | `IndexPage` |
| `/#/categories` | `CategoriesIndexPage` |
| `/#/categories/:id` | `CategoryPage` |
| `/#/categories/:id/items` | `CategoryItemsIndexPage` |
| `/#/categories/:categoryId/items/:id` | `CategoryItemPage` |

---

## Docker Compose

| Service | Port | Purpose |
|---------|------|---------|
| `navi_dev_app` | `3020:80` | Express dev API (`dev/app/`) |
| `navi_dev_frontend` | — | Builds React SPA (`dev/frontend/`) into `dev/proxy/static/` |
| `navi_proxy` | `3010:80` | Tent reverse proxy + caching |
| `navi_app` | — | Navi cache-warmer |
| `navi_tests` | — | Test/lint container for `source/` |

Startup order: `navi_dev_app` → `navi_dev_frontend` → `navi_proxy` → `navi_app`.

---

## CI

| Job | Directory | What it does |
|-----|-----------|-------------|
| `jasmine` + `checks` | `source/` | Navi tests + lint |
| `jasmine-dev` + `checks-dev` | `dev/app/` | Dev-app tests + lint (copies `source/lib/common` and `source/spec/lib/common` into `dev/app`) |
| `jasmine-dev-frontend` + `checks-dev-frontend` | `dev/frontend/` | Dev-frontend tests + lint |
| `coverage-final` | — | Sends Codacy final signal after all partial uploads |

# Dev Application

The dev application is a sample JSON API used as the target backend when developing and testing Navi (the cache-warmer). It provides a small, predictable dataset so that Navi's HTTP requests, proxy interactions, and caching behaviour can be verified in a controlled environment.

The dev app exists in two versions that are currently running in parallel:

| Directory | Implementation | Status |
|-----------|---------------|--------|
| `dev/` | Static JSON files served by Apache httpd | Current (active) |
| `new-dev/` | Dynamic Express/Node.js server | New version (in development) |

---

## Overview

Navi is configured to warm a cache by issuing HTTP requests to a backend through a reverse proxy (`navi_proxy`, powered by [tent](https://github.com/darthjee/tent)). The dev application is that backend. It exposes a simple categories-and-items REST API. Navi reads a YAML config that lists these endpoints as resources to warm, issues the requests, and the proxy caches the responses.

```
navi_app ──► navi_proxy (tent, :3010) ──► navi_httpd / new-dev (:3020/:80)
```

---

## `dev/` — Static version

### Structure

```
dev/
├── categories.json
└── categories/
    ├── 1.json
    ├── 1/itens.json
    ├── 2.json
    ├── 2/itens.json
    ├── 3.json
    └── 3/itens.json
```

### How it works

Apache httpd serves the files in `dev/` directly. Each URL maps to a file on disk. There is no routing logic — a request for `/categories/1.json` is served from `dev/categories/1.json`.

### Endpoints

| Method | Path | File |
|--------|------|------|
| GET | `/categories.json` | `dev/categories.json` |
| GET | `/categories/:id.json` | `dev/categories/:id.json` |
| GET | `/categories/:id/itens.json` | `dev/categories/:id/itens.json` |

> Note: the items path in `dev/` is `itens.json` (Portuguese spelling). `new-dev/` uses `items.json`.

### Data

Three categories, each with three items:

| Category | Items |
|----------|-------|
| Books (1) | The Hobbit, The Lord of the Rings, The Silmarillion |
| Movies (2) | The Shawshank Redemption, The Godfather, The Dark Knight |
| Music (3) | The Beatles, Nirvana, Queen |

---

## `new-dev/` — Dynamic version

### Structure

```
new-dev/
├── server.js       # Entrypoint (script) — calls app.listen(80)
├── app.js          # App module (class declarer) — exports configured Express app
├── data.yml        # Data source (same categories/items as dev/)
├── package.json
├── eslint.config.mjs
├── yarn.lock
└── spec/
    └── app_spec.js
```

### Backend

**Stack:** Node.js (ES Modules), Express 4, js-yaml

**Server launcher (entrypoint):** `server.js` — imports the app and calls `listen(80)`. This is the only file in `new-dev/` that acts as a script.

**App module:** `app.js` — declares and exports the configured Express app (routes + middleware) without calling `listen`. Imported by both `server.js` and the test suite.

**Data loading:** `data.yml` is read once at startup with `readFileSync` and parsed with `js-yaml`. The result is kept in memory for the lifetime of the process.

### Routes

All routes are registered in `app.js`:

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
2. For parameterised routes, `req.params.id` (and `req.params.item_id`) are coerced to `Number` for the `Array#find` lookup.
3. If no matching record is found, the handler returns early with `res.status(404).json(…)`.
4. The catch-all `app.use` at the bottom handles any path that matched no route.

### How to add a new endpoint

1. Add the data to `data.yml` under the appropriate key.
2. Register a new `app.get(…)` handler in `app.js` before the catch-all `app.use`.
3. Write a corresponding `describe` block in `spec/app_spec.js` covering the happy path and the 404 case.

---

## Testing (`new-dev/`)

**Framework:** Jasmine 5 + Supertest 7

Tests live in `new-dev/spec/app_spec.js`. They import the Express app directly (no server needed) and use Supertest to issue HTTP requests in-process.

### What is covered

| Describe block | Cases |
|----------------|-------|
| `GET /categories.json` | 200 + non-empty array + no nested items |
| `GET /categories/:id.json` | 200 for valid ID; 404 for unknown ID |
| `GET /categories/:id/items.json` | 200 + non-empty array; 404 for unknown category |
| `GET /categories/:id/items/:item_id.json` | 200 for valid IDs; 404 for unknown item |
| Unmatched routes | 404 for `/unknown` |

### Running tests

Inside the `new-dev/` directory:

```bash
yarn test       # Run tests with c8 coverage (text + HTML)
yarn coverage   # Run tests and produce coverage/lcov.info (for CI)
yarn lint       # ESLint
yarn report     # JSCPD duplication analysis
```

There is no dedicated Docker service for `new-dev/` tests yet. Tests run directly via the CircleCI `jasmine-dev` job using the `darthjee/circleci_node:0.2.1` image.

---

## CI

| Job | Directory | What it does |
|-----|-----------|-------------|
| `jasmine` | `source/` | Runs Navi's own tests + uploads coverage to Codacy (partial) |
| `checks` | `source/` | ESLint + JSCPD |
| `jasmine-dev` | `new-dev/` | Runs dev-app tests + uploads coverage to Codacy (partial) |
| `checks-dev` | `new-dev/` | ESLint + JSCPD |
| `coverage-final` | — | Sends the Codacy `final` signal after both partial uploads complete |

`jasmine-dev` and `checks-dev` mirror the structure of `jasmine` and `checks`. `coverage-final` depends on both `jasmine` and `jasmine-dev` so Codacy receives a combined coverage report from both applications.

All jobs run on every push and every tag. There are no branch restrictions on the test jobs.

---

## Docker Compose

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| `navi_httpd` | `httpd` | `3020:80` | Serves static files from `dev/` (Apache) |
| `navi_proxy` | `darthjee/tent:0.5.0` | `3010:80` | Reverse-proxy + caching layer in front of `navi_httpd` |
| `navi_app` | `navi:dev` | — | Navi application container; linked to `navi_proxy` as `remote_host` |
| `navi_tests` | `navi:dev` | — | Test/lint container for `source/` |

`new-dev/` does not have a dedicated Docker Compose service yet. Its tests run directly in CI without Docker.

### Dependency chain

```
navi_app ──depends_on──► navi_proxy ──depends_on──► navi_httpd
navi_tests ──depends_on──► base_build
```

### Environment variables

The services use an `.env` file (copied from `.env.sample` during `make setup`). No dev-app-specific environment variables are required beyond what the base image provides.

---

## Differences between `dev/` and `new-dev/`

| Aspect | `dev/` | `new-dev/` |
|--------|--------|------------|
| Implementation | Static JSON files | Express/Node.js app |
| Server | Apache httpd (Docker image `httpd`) | Node.js (`server.js` → `app.listen(80)`); `app.js` exports the app module |
| Data source | Individual `.json` files on disk | Single `data.yml` file loaded at startup |
| Items path | `/categories/:id/itens.json` (Portuguese) | `/categories/:id/items.json` (English) |
| 404 handling | Apache default 404 page | JSON `{"error": "Not found"}` |
| Test suite | None | Jasmine + Supertest (`spec/app_spec.js`) |
| Coverage | None | c8 → `coverage/lcov.info` |
| Linting | None | ESLint with flat config (`eslint.config.mjs`) |
| Duplication check | None | JSCPD |
| Docker Compose service | `navi_httpd` | Not yet added |
| Dependencies | None (pure static) | `express`, `js-yaml` |

# Plan: Change Dev Container to Use Express (#68)

Issue: https://github.com/darthjee/navi/issues/68

## Context

The current dev environment has an `navi_httpd` container (Apache `httpd` image) that serves
static JSON files from the `./dev/` directory. Requests flow through `navi_proxy`
(a `darthjee/tent` cache) which forwards to `navi_httpd` as `backend`.

```
navi_app → navi_proxy (cache, port 3010) → navi_httpd (Apache, port 3020) → ./dev/ static files
```

The goal is to replace `navi_httpd` with a Node.js Express app that reads a YAML data file and
dynamically registers all endpoints at startup. This enables data-driven testing without touching
code.

## New Architecture

```
navi_app → navi_proxy (cache, port 3010) → navi_httpd (Express, port 3020) → ./dev/data.yml
```

The `navi_httpd` container keeps the same name and role in the network (`backend` alias used by
the proxy rules). No changes are needed to `navi_proxy` or its config.

The `./dev/` directory is repurposed: the static JSON files are replaced by the Express
application code and a single `data.yml` data file.

## Directory Structure

```
dev/
  app.js          ← Express entry point; loads YAML and registers routes
  package.json    ← dependencies: express, js-yaml
  yarn.lock
  data.yml        ← YAML data file defining categories and items

dockerfiles/
  dev_httpd/
    Dockerfile    ← new Dockerfile for the Express container
```

See [data-format.md](data-format.md) for the YAML data structure and generated endpoints.

## Steps

### Step 1 — Replace static files in `./dev/` with Express app

Remove all existing static files and subdirectories from `./dev/` and create:

- `dev/data.yml` — YAML data file with the same data previously served statically:
  - Migrate `dev/categories.json` → top-level `categories` array
  - Migrate `dev/categories/*/itens.json` → nested `items` arrays per category
  - Migrate `dev/categories/*.json` → individual category entries

- `dev/app.js` — Express app that:
  1. Reads `data.yml` at startup using `js-yaml`.
  2. Registers four route groups from the loaded data:
     - `GET /categories.json`
     - `GET /categories/:id.json`
     - `GET /categories/:id/items.json`
     - `GET /categories/:id/items/:item_id.json`
  3. Returns `404` JSON for unmatched routes.
  4. Listens on port `80`.

- `dev/package.json` — minimal package with `express` and `js-yaml` as dependencies.
  Run `yarn install` to generate `yarn.lock`.

### Step 2 — Create `dockerfiles/dev_httpd/Dockerfile`

Based on `darthjee/node:0.2.1`. Copies `dev/` into the image, runs `yarn install`,
and starts `node app.js`.

### Step 3 — Update `docker-compose.yml`

Replace the `navi_httpd` service definition:

```yaml
# Before
navi_httpd:
  image: httpd
  volumes:
    - ./dev:/usr/local/apache2/htdocs
  ports:
    - "0.0.0.0:3020:80"

# After
navi_httpd:
  build:
    context: .
    dockerfile: dockerfiles/dev_httpd/Dockerfile
  volumes:
    - ./dev/data.yml:/home/node/app/data.yml
  ports:
    - "0.0.0.0:3020:80"
```

Mounting only `data.yml` as a volume means the data can be updated without rebuilding the image.

### Step 4 — Update `Makefile`

Add a `build-httpd` target to build the new Express image:

```makefile
build-httpd:
  $(COMPOSE) build navi_httpd
```

## Acceptance Criteria

- [ ] `./dev/` contains only the Express app files (`app.js`, `package.json`, `yarn.lock`, `data.yml`)
- [ ] `dev/data.yml` contains all categories and items previously served as static files
- [ ] Express app serves all four endpoint groups with correct JSON responses
- [ ] `navi_proxy` continues to forward and cache requests correctly
- [ ] `docker compose up navi_httpd` starts with no errors
- [ ] Changing `dev/data.yml` and restarting the container reflects new data without rebuilding
- [ ] Documentation updated

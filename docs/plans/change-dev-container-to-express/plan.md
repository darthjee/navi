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
navi_app → navi_proxy (cache, port 3010) → navi_express (Express, port 3020) → dev_server/data.yml
```

The `navi_express` container replaces `navi_httpd` and keeps the same role in the network
(`backend` alias used by the proxy rules). No changes are needed to `navi_proxy` or its config.

## Directory Structure

```
dev_server/
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

### Step 1 — Create `dev_server/data.yml`

Define the YAML data file with the same data currently served statically in `./dev/`.

Migrate existing data:
- `dev/categories.json` → top-level `categories` array in `data.yml`
- `dev/categories/*/itens.json` → nested `items` arrays per category
- `dev/categories/*.json` → individual category entries

### Step 2 — Create `dev_server/app.js`

Express app that:
1. Reads `data.yml` at startup using `js-yaml`.
2. Registers four route groups from the loaded data:
   - `GET /categories.json`
   - `GET /categories/:id.json`
   - `GET /categories/:id/items.json`
   - `GET /categories/:id/items/:item_id.json`
3. Returns `404` JSON for unmatched routes.
4. Listens on port `80`.

### Step 3 — Create `dev_server/package.json`

Minimal package with `express` and `js-yaml` as dependencies.
Run `yarn install` to generate `yarn.lock`.

### Step 4 — Create `dockerfiles/dev_httpd/Dockerfile`

Based on `darthjee/node:0.2.1`. Copies `dev_server/` into the image, runs `yarn install`,
and starts `node app.js`.

### Step 5 — Update `docker-compose.yml`

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
    - ./dev_server/data.yml:/home/node/app/data.yml
  ports:
    - "0.0.0.0:3020:80"
```

Mounting `data.yml` as a volume means the server can be updated without rebuilding the image.

### Step 6 — Update `Makefile`

Add a `build-httpd` target (or extend `setup`) to build the new Express image:

```makefile
build-httpd:
  $(COMPOSE) build navi_httpd
```

### Step 7 — Clean up `./dev/`

Remove the static JSON files from `./dev/` once the Express server is validated.
The `./dev/` directory can be removed entirely or kept empty.

## Acceptance Criteria

- [ ] `dev_server/data.yml` contains all categories and items previously in `./dev/`
- [ ] Express app serves all four endpoint groups with correct JSON responses
- [ ] `navi_proxy` continues to forward and cache requests correctly
- [ ] `docker compose up navi_httpd` starts with no errors
- [ ] Changing `data.yml` and restarting the container reflects new data without rebuilding
- [ ] `./dev/` static files removed
- [ ] Documentation updated

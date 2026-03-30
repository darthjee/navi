# Plan: Finalise Dev Container Migration (#82)

Issue: <https://github.com/darthjee/navi/issues/82>
Parent: <https://github.com/darthjee/navi/issues/68>
Depends on: #81

## Context

This is the final issue of the migration. By this point the Express container is running from
`new-dev/`. This issue renames `new-dev/` → `dev/`, removes the old static files, updates the
`docker-compose.yml` volume path, and adds the `build-httpd` Makefile target.

## Step 1 — Rename `new-dev/` to `dev/`

Remove the old static files from `dev/`:

```
dev/categories.json
dev/categories/1.json
dev/categories/1/itens.json
dev/categories/2.json
dev/categories/2/itens.json
dev/categories/3.json
dev/categories/3/itens.json
```

Move all files from `new-dev/` into `dev/`:

```
new-dev/app.js     → dev/app.js
new-dev/package.json → dev/package.json
new-dev/yarn.lock  → dev/yarn.lock
new-dev/data.yml   → dev/data.yml
```

Remove the now-empty `new-dev/` directory.

## Step 2 — Update `docker-compose.yml`

Change the volume path in the `navi_httpd` service:

```yaml
# Before
volumes:
  - ./new-dev/data.yml:/home/node/app/data.yml

# After
volumes:
  - ./dev/data.yml:/home/node/app/data.yml
```

## Step 3 — Update `dockerfiles/dev_httpd/Dockerfile`

Change the `COPY` source from `new-dev/` to `dev/`:

```dockerfile
# Before
COPY --chown=node:node ./new-dev/ /home/node/app/

# After
COPY --chown=node:node ./dev/ /home/node/app/
```

## Step 4 — Add `build-httpd` to `Makefile`

Add `build-httpd` to the `.PHONY` list, add a help line, and add the target:

```makefile
DOCKERFILE_HTTPD ?= dockerfiles/dev_httpd/Dockerfile
```

```makefile
@echo "  make build-httpd  Build dev httpd image from $(DOCKERFILE_HTTPD)"
```

```makefile
build-httpd:
 docker build -f $(DOCKERFILE_HTTPD) . -t $(IMAGE):httpd
```

## Acceptance Criteria

- [ ] `new-dev/` no longer exists.
- [ ] `dev/` contains only `app.js`, `package.json`, `yarn.lock`, `data.yml`.
- [ ] `docker-compose.yml` mounts `./dev/data.yml`.
- [ ] `dockerfiles/dev_httpd/Dockerfile` copies from `./dev/`.
- [ ] `make build-httpd` builds the `navi_httpd` image without errors.
- [ ] `make help` lists the `build-httpd` target.
- [ ] `docker compose up navi_httpd` continues to work correctly.

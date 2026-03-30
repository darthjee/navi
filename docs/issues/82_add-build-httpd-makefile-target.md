# 82: Finalise Dev Container Migration

Parent issue: <https://github.com/darthjee/navi/issues/68>
Depends on: #81

## Background

With the Express container wired into `docker-compose.yml` using `new-dev/` (#81), this final
issue completes the migration by renaming `new-dev/` to `dev/`, removing the old static files,
updating the volume path in `docker-compose.yml`, and adding a `build-httpd` Makefile target.

## Task

1. **Rename `new-dev/` to `dev/`** — replace the existing `dev/` directory (static JSON files)
   with the Express app directory.
   - Remove `dev/categories.json`, `dev/categories/1.json`, `dev/categories/1/itens.json`,
     `dev/categories/2.json`, `dev/categories/2/itens.json`, `dev/categories/3.json`,
     `dev/categories/3/itens.json`.
   - Move all files from `new-dev/` into `dev/`.

2. **Update `docker-compose.yml`** — change the volume path from `./new-dev/data.yml` to
   `./dev/data.yml`.

3. **Add `build-httpd` target to `Makefile`** — consistent with existing `build-dev` and `build`
   targets:

   ```makefile
   build-httpd:
   	$(COMPOSE) build navi_httpd
   ```

## Acceptance Criteria

- [ ] `new-dev/` no longer exists.
- [ ] `dev/` contains only Express app files (`app.js`, `package.json`, `yarn.lock`, `data.yml`).
- [ ] `docker-compose.yml` mounts `./dev/data.yml`.
- [ ] `make build-httpd` builds the `navi_httpd` image without errors.
- [ ] `make help` lists the `build-httpd` target.
- [ ] `docker compose up navi_httpd` continues to work correctly.

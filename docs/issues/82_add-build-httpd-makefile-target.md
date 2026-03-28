# 82: Add `build-httpd` Target to Makefile

Parent issue: https://github.com/darthjee/navi/issues/68
Depends on: #81

## Background

With the Express container wired into `docker-compose.yml` (X04), the `Makefile` should expose a convenient target for building the `navi_httpd` image, consistent with the existing `build-dev` and `build` targets.

## Task

Add a `build-httpd` target to the `Makefile`:

```makefile
build-httpd:
	$(COMPOSE) build navi_httpd
```

## Acceptance Criteria

- [ ] `make build-httpd` builds the `navi_httpd` Docker image without errors.
- [ ] The new target is listed in `make help` output (if applicable).

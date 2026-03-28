# Plan: Add `build-httpd` Target to Makefile (#82)

Issue: https://github.com/darthjee/navi/issues/82
Parent: https://github.com/darthjee/navi/issues/68
Depends on: #81

## Context

With the Express container wired into `docker-compose.yml` (#81), the `Makefile` should expose
a `build-httpd` target consistent with the existing `build-dev` and `build` targets.

Current relevant targets for reference:

```makefile
build-dev:
	docker build -f $(DOCKERFILE_DEV) . -t $(IMAGE):dev

build:
	docker build -f $(DOCKERFILE_PROD) . -t $(IMAGE):latest
```

## Step 1 — Add variable and target to `Makefile`

Add `build-httpd` to the `.PHONY` list, declare the Dockerfile path variable, add the help line,
and add the target:

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

- [ ] `make build-httpd` builds the `navi_httpd` Docker image without errors.
- [ ] `make help` lists the `build-httpd` target.

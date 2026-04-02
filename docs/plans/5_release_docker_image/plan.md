# Plan: Release Docker Image (Issue #5)

## Objective

Provide an automated, reproducible CI flow that builds and publishes a minimal production Docker image for `darthjee/navi`. Move most of the build/release complexity into the repository Makefile so CI calls a single, well-tested target (`make release`) that encapsulates build, tag and push behavior.

## Deliverables

- `dockerfiles/production_navi/Dockerfile`
- `DOCKERHUB_DESCRIPTION.md`
- Makefile targets to build and release the image
- CircleCI jobs that call Makefile targets (`make release`, `make update-description`)
- Release helper script (optional) and CI snippets
- Docs updated (`docs/issues/5_release_docker_image.md` and this plan)

## High-level Approach

1. Implement a robust Makefile target(s) that:
   - Build the production image (`make build-image`)
   - Tag and push image(s) (`make release`), accepting TAG via env or parameter
   - Update Docker Hub description (`make update-description`)
2. Keep CircleCI lightweight: run tests/checks, then call `make release` on a machine executor.
3. Keep the Dockerfile minimal and reproducible (multi-stage, production deps only).

## Makefile Integration (why)

- Centralizes build logic so developers can reproduce CI steps locally with the same commands.
- Simplifies CircleCI config: CI executes `make release` instead of duplicating build scripts.
- Makes retry/backoff and additional steps (signing, scanning) easier to add and test locally.

## Detailed Tasks

- Task A — Dockerfile
  - As before: multi-stage build, copy only `source/`, install production deps.

- Task B — Makefile (new)
  - Add targets:
    - `build-image` — builds the image for a given TAG (default `latest`).
    - `release` — calls `build-image` then pushes tags; supports `TAG` env var or `CIRCLE_TAG`.
    - `update-description` — pushes `DOCKERHUB_DESCRIPTION.md` using helper script or Docker Hub API.
  - Ensure targets are idempotent and print informative output.

Example Makefile fragment to add:

```makefile
# filepath: /Users/darthjee/projetos/mine/navi/Makefile
.PHONY: build-image release update-description

IMAGE := darthjee/navi
DOCKERFILE := dockerfiles/production_navi/Dockerfile
PLATFORM := linux/amd64

build-image:
    @if [ -z "$(TAG)" ]; then echo "TAG not set (use TAG=<tag> make build-image)"; exit 1; fi
    docker build --platform $(PLATFORM) -f $(DOCKERFILE) -t $(IMAGE):$(TAG) -t $(IMAGE):latest .

release:
    # provide TAG via env: TAG=1.2.3 make release (CI should set TAG=${CIRCLE_TAG:-latest})
    @if [ -z "$(TAG)" ]; then echo "TAG not set (use TAG=<tag> make release)"; exit 1; fi
    $(MAKE) build-image TAG=$(TAG)
    echo "$$DOCKER_HUB_PASSWORD" | docker login -u "$$DOCKER_HUB_USERNAME" --password-stdin
    docker push $(IMAGE):$(TAG)
    docker push $(IMAGE):latest

update-description:
    # expects helper script in scripts/ or CI image
    /bin/sh ./scripts/docker_hub.sh login_and_push_description $(IMAGE) DOCKERHUB_DESCRIPTION.md
```

- Task C — CircleCI
  - Update `.circleci/config.yml` so `build-and-release` runs `machine: true` and simply executes:
    - checkout
    - make release TAG=${CIRCLE_TAG:-latest}
  - Ensure workflow requires: jasmine, jasmine-dev, checks, checks-dev before `build-and-release`.

- Task D — Documentation & examples
  - Document how to run `make build-image` and `make release` locally.
  - Add sample config to `docs/examples/` (no test fixtures in production image).

## Acceptance Criteria (updated)

- [ ] Makefile contains `build-image`, `release`, and `update-description` targets.
- [ ] `.circleci/config.yml` calls `make release` from `build-and-release` job (machine executor).
- [ ] CI `build-and-release` requires `[jasmine, jasmine-dev, checks, checks-dev]`.
- [ ] Pushing to `main` runs `make release` and publishes `latest`; tagging publishes versioned tag + latest.
- [ ] `DOCKERHUB_DESCRIPTION.md` applied by `make update-description`.
- [ ] Docs updated with local reproduction steps.

## Notes

- Keep secrets in CI env variables (`DOCKER_HUB_USERNAME`, `DOCKER_HUB_PASSWORD`).
- Makefile targets should be simple commands so they work both locally and in CI.
- Prefer explicit platform targeting for reproducibility.
- Test Makefile targets locally before merging to ensure CI run parity.
```// filepath: /Users/darthjee/projetos/mine/navi/docs/plans/5_release_docker_image/plan.md
# Plan: Release Docker Image (Issue #5)

## Objective

Provide an automated, reproducible CI flow that builds and publishes a minimal production Docker image for `darthjee/navi`. Move most of the build/release complexity into the repository Makefile so CI calls a single, well-tested target (`make release`) that encapsulates build, tag and push behavior.

## Deliverables

- `dockerfiles/production_navi/Dockerfile`
- `DOCKERHUB_DESCRIPTION.md`
- Makefile targets to build and release the image
- CircleCI jobs that call Makefile targets (`make release`, `make update-description`)
- Release helper script (optional) and CI snippets
- Docs updated (`docs/issues/5_release_docker_image.md` and this plan)

## High-level Approach

1. Implement a robust Makefile target(s) that:
   - Build the production image (`make build-image`)
   - Tag and push image(s) (`make release`), accepting TAG via env or parameter
   - Update Docker Hub description (`make update-description`)
2. Keep CircleCI lightweight: run tests/checks, then call `make release` on a machine executor.
3. Keep the Dockerfile minimal and reproducible (multi-stage, production deps only).

## Makefile Integration (why)

- Centralizes build logic so developers can reproduce CI steps locally with the same commands.
- Simplifies CircleCI config: CI executes `make release` instead of duplicating build scripts.
- Makes retry/backoff and additional steps (signing, scanning) easier to add and test locally.

## Detailed Tasks

- Task A — Dockerfile
  - As before: multi-stage build, copy only `source/`, install production deps.

- Task B — Makefile (new)
  - Add targets:
    - `build-image` — builds the image for a given TAG (default `latest`).
    - `release` — calls `build-image` then pushes tags; supports `TAG` env var or `CIRCLE_TAG`.
    - `update-description` — pushes `DOCKERHUB_DESCRIPTION.md` using helper script or Docker Hub API.
  - Ensure targets are idempotent and print informative output.

Example Makefile fragment to add:

```makefile
# filepath: /Users/darthjee/projetos/mine/navi/Makefile
.PHONY: build-image release update-description

IMAGE := darthjee/navi
DOCKERFILE := dockerfiles/production_navi/Dockerfile
PLATFORM := linux/amd64

build-image:
    @if [ -z "$(TAG)" ]; then echo "TAG not set (use TAG=<tag> make build-image)"; exit 1; fi
    docker build --platform $(PLATFORM) -f $(DOCKERFILE) -t $(IMAGE):$(TAG) -t $(IMAGE):latest .

release:
    # provide TAG via env: TAG=1.2.3 make release (CI should set TAG=${CIRCLE_TAG:-latest})
    @if [ -z "$(TAG)" ]; then echo "TAG not set (use TAG=<tag> make release)"; exit 1; fi
    $(MAKE) build-image TAG=$(TAG)
    echo "$$DOCKER_HUB_PASSWORD" | docker login -u "$$DOCKER_HUB_USERNAME" --password-stdin
    docker push $(IMAGE):$(TAG)
    docker push $(IMAGE):latest

update-description:
    # expects helper script in scripts/ or CI image
    /bin/sh ./scripts/docker_hub.sh login_and_push_description $(IMAGE) DOCKERHUB_DESCRIPTION.md
```

- Task C — CircleCI
  - Update `.circleci/config.yml` so `build-and-release` runs `machine: true` and simply executes:
    - checkout
    - make release TAG=${CIRCLE_TAG:-latest}
  - Ensure workflow requires: jasmine, jasmine-dev, checks, checks-dev before `build-and-release`.

- Task D — Documentation & examples
  - Document how to run `make build-image` and `make release` locally.
  - Add sample config to `docs/examples/` (no test fixtures in production image).

## Acceptance Criteria (updated)

- [ ] Makefile contains `build-image`, `release`, and `update-description` targets.
- [ ] `.circleci/config.yml` calls `make release` from `build-and-release` job (machine executor).
- [ ] CI `build-and-release` requires `[jasmine, jasmine-dev, checks, checks-dev]`.
- [ ] Pushing to `main` runs `make release` and publishes `latest`; tagging publishes versioned tag + latest.
- [ ] `DOCKERHUB_DESCRIPTION.md` applied by `make update-description`.
- [ ] Docs updated with local reproduction steps.

## Notes

- Keep secrets in CI env variables (`DOCKER_HUB_USERNAME`, `DOCKER_HUB_PASSWORD`).
- Makefile targets should be simple commands so they work both locally and in CI.
- Prefer explicit platform targeting for reproducibility.
- Test Makefile targets locally before merging
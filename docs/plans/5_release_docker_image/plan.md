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

## Dockerfile — implementation details and guidance

Developers should use `dockerfiles/dev_navi/Dockerfile` as inspiration for layout and caching techniques, but the production Dockerfile must **not** install development dependencies or include test/spec files.

Key rules and recommended structure:

- Base image
  - Use `darthjee/production_node:0.2.1` (or another production-focused base) for both reproducibility and parity with existing images.

- Multi-stage build
  - Stage: builder
    - COPY only `source/package.json` and `source/yarn.lock` first.
    - Run `yarn install --frozen-lockfile` (no --production flag here if you build production node_modules in a later step, but prefer installing production deps only when possible).
    - COPY the rest of `source/`.
    - If a build/transpile step is required, run it in this stage.
  - Stage: final
    - Start from a small runtime base (alpine or the production_node image).
    - Set `ENV NODE_ENV=production`.
    - COPY only the artifacts required to run the app (built files and production node_modules).
    - Do NOT copy `spec/`, `source/spec/`, `docs/`, or other dev files.
    - Create an unprivileged user and switch to it.

- Install production dependencies only
  - Ensure the final image contains only production dependencies:
    - Option A (recommended): in builder, install production deps only (`yarn install --frozen-lockfile --production`) and copy node_modules to final.
    - Option B: install all deps in builder then run `yarn install --production --frozen-lockfile` in final to prune dev deps.
  - Use `--frozen-lockfile` to guarantee reproducible installs.

- Caching and layers
  - Copy package.json/yarn.lock and run `yarn install` before copying source to leverage Docker layer caching.
  - If using yarn v2/berry, adapt cache copies similar to `dev_navi` but avoid copying dev caches into the final image.

- Exclude files
  - Add a `.dockerignore` that excludes:
    - `spec/`, `node_modules/`, `.git`, `docs/`, `dockerfiles/`, local editor files, and any test fixtures.
  - This prevents accidental inclusion of tests or large files.

- Image size and reproducibility
  - Prefer smaller runtime base and remove build tools from the final stage.
  - Pin base image versions and use `--platform linux/amd64` in CI builds.

- Health and runtime behavior
  - Expose the port used by the app (e.g., `EXPOSE 80`).
  - Provide a sensible `CMD`/`ENTRYPOINT` (e.g., `node bin/navi.js`).
  - Optionally add a `HEALTHCHECK` for basic smoke testing.

- Security
  - Run the app as a non-root user.
  - Avoid embedding secrets or environment-specific config; expect config to be mounted at runtime.

- Local reproducibility
  - Document how to build and run the image locally using Makefile targets:
    - `TAG=local make build-image`
    - `docker run --rm -p 8080:80 -v $(pwd)/docker_volumes/config:/app/config darthjee/navi:local`

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

## References

- See `dockerfiles/dev_navi/Dockerfile` for caching and multi-stage patterns.
- Use this plan's Makefile targets and CI snippets to keep behavior consistent between local and CI builds.
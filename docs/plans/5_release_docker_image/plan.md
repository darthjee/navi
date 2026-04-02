# Plan: Release Docker Image (Issue #5)

## Objective

Provide an automated, reproducible CI flow that builds and publishes a minimal production Docker image for `darthjee/navi`. The image must contain only the production application (no specs, no dev deps), be tagged properly (git tag → versioned tag + latest), and update the Docker Hub repository description after a successful release.

## Deliverables

- `dockerfiles/production_navi/Dockerfile` (production Dockerfile)
- `DOCKERHUB_DESCRIPTION.md` at repo root
- CircleCI jobs: `build-and-release` and `update-description`
- Release helper script or commands used by CI
- Documentation: `docs/issues/5_release_docker_image.md` (updated) and this plan
- Optional: `docs/examples/sample_config.yml` (runtime config example)

## High-level Steps

1. Create a minimal production Dockerfile that:
   - Copies only the `source/` app files (exclude specs and test fixtures).
   - Installs production dependencies (Yarn) only.
   - Uses an unprivileged user where appropriate.
   - Targets a reproducible platform (linux/amd64).

2. Add `DOCKERHUB_DESCRIPTION.md` describing the image, usage and ports.

3. Add CircleCI jobs:
   - `build-and-release` (machine executor) that depends on test/lint jobs: jasmine, jasmine-dev, checks, checks-dev.
   - `update-description` that runs after `build-and-release` and pushes `DOCKERHUB_DESCRIPTION.md` to Docker Hub.

4. Securely configure CircleCI env variables:
   - `DOCKER_HUB_USERNAME`
   - `DOCKER_HUB_PASSWORD` (token preferred)

5. Add a small release script or inline job steps in CircleCI to:
   - Build image with tag from `CIRCLE_TAG` or `latest`.
   - Push both tags to Docker Hub.
   - Optionally sign or scan the image.

6. Add local verification steps and docs for maintainers.

## Detailed Tasks

- Task A — Dockerfile
  - Create `dockerfiles/production_navi/Dockerfile`.
  - Use multi-stage build:
    - Builder stage: install Yarn, copy source, run `yarn install --production=false` and build if needed.
    - Final stage: copy only built artifacts and `node_modules` production deps, use `yarn install --production` or `NODE_ENV=production yarn install --production` in builder to keep final image small.
  - Example: keep node base image aligned with `darthjee/production_node:0.2.1` or reference it.

- Task B — CircleCI
  - Modify `.circleci/config.yml` workflow `test-and-release` to require `jasmine`, `jasmine-dev`, `checks`, `checks-dev` before `build-and-release`.
  - Implement `build-and-release` using `machine: true` so Docker CLI is available.
  - Implement `update-description` that runs after `build-and-release`.

- Task C — Release script
  - Provide a script snippet in CI:
    - Determine TAG: `TAG=${CIRCLE_TAG:-latest}`
    - docker build --platform linux/amd64 -f dockerfiles/production_navi/Dockerfile -t darthjee/navi:$TAG -t darthjee/navi:latest .
    - docker login && docker push both tags
  - Ensure retry/backoff on transient push failures.

- Task D — Docker Hub description update
  - Use existing helper script if available (`docker_hub.sh`), or implement a small script that uses Docker Hub API or `hub` CLI.
  - Keep credentials in CircleCI env vars.

- Task E — Documentation & examples
  - Provide `DOCKERHUB_DESCRIPTION.md`.
  - Add example runtime config at `docs/examples/sample_config.yml`.
  - Update `docs/issues/5_release_docker_image.md` to reference these artifacts and CI behavior.

- Task F — Local verification
  - Document commands to build and run locally:
    - docker build -f dockerfiles/production_navi/Dockerfile -t darthjee/navi:local .
    - docker run --rm -p 8080:80 -v $(pwd)/docker_volumes/config:/app/config darthjee/navi:local

## Example Dockerfile (multi-stage — minimal)

```dockerfile
# Builder stage
FROM darthjee/production_node:0.2.1 AS build
WORKDIR /app
COPY source/package.json source/yarn.lock ./
RUN yarn install --frozen-lockfile
COPY source/ ./
# If build step needed (e.g. transpile), run it here
# RUN yarn build

# Production image
FROM node:18-alpine
ENV NODE_ENV=production
WORKDIR /app
# Copy only necessary artifacts and production node_modules
COPY --from=build /app /app
RUN yarn install --production --frozen-lockfile --network-timeout 100000
USER node
EXPOSE 80
CMD ["node", "bin/navi.js"]
```

Notes: adapt base images to match `darthjee/production_node` philosophy. Keep image small and reproducible.

## Example CircleCI job snippets

Add to `.circleci/config.yml`:

```yaml
  build-and-release:
    machine: true
    steps:
      - checkout
      - run:
          name: Build and push Docker image
          command: |
            TAG=${CIRCLE_TAG:-latest}
            docker build --platform linux/amd64 -f dockerfiles/production_navi/Dockerfile . -t darthjee/navi:$TAG -t darthjee/navi:latest
            echo "$DOCKER_HUB_PASSWORD" | docker login -u "$DOCKER_HUB_USERNAME" --password-stdin
            docker push darthjee/navi:$TAG
            docker push darthjee/navi:latest

  update-description:
    machine: true
    steps:
      - checkout
      - run:
          name: Update Docker Hub description
          command: |
            /bin/sh /home/scripts/sbin/docker_hub.sh login_and_push_description darthjee/navi DOCKERHUB_DESCRIPTION.md
```

Ensure workflow `build-and-release` has `requires: [jasmine, jasmine-dev, checks, checks-dev]`.

## Testing & Verification

- CI must pass: unit tests (source & dev), lint, duplication checks.
- After merge to main:
  - Verify CircleCI job ran `build-and-release`.
  - Confirm docker hub tags: `latest` and versioned tag (if pushed).
  - Confirm Docker Hub description updated.
- Local verification:
  - Build image locally and run smoke tests (health endpoint, basic request using sample_config).

## Security & Secrets

- Never commit credentials. Use CircleCI project environment variables.
- Prefer Docker Hub access tokens over account passwords.
- Limit token scope if possible.

## Rollout & Rollback

- Initial rollout pushes `latest`. For releases use git tag to push versioned image.
- If release is faulty, remove the tag on Docker Hub and fix CI/Dockerfile; do not rely on `latest` as immutable.

## Acceptance Criteria (measurable)

- [ ] `dockerfiles/production_navi/Dockerfile` exists and builds a minimal production image.
- [ ] `.circleci/config.yml` contains `build-and-release` and `update-description` jobs; `build-and-release` requires tests/lint jobs.
- [ ] CircleCI uses `machine: true` for `build-and-release`.
- [ ] Push works: merging to `main` pushes `darthjee/navi:latest`.
- [ ] Creating a git tag pushes `darthjee/navi:<tag>` and `latest`.
- [ ] `DOCKERHUB_DESCRIPTION.md` exists and is applied by `update-description`.
- [ ] Documentation updated with local build/run instructions and sample runtime config.

## Timeline & Milestones

- Day 1: Create Dockerfile + DOCKERHUB_DESCRIPTION.md; local build verification.
- Day 2: Add CI jobs + env vars; test on feature branch.
- Day 3: Finalize docs, sample config, and merge.

---

If you want, I can generate:
- a starter `dockerfiles/production_navi/Dockerfile`,
- the CircleCI job YAML snippet ready to paste into `.circleci/config.yml`,
- and a small release shell script for CI. Which one should I produce first?// filepath: /Users/darthjee/projetos/mine/navi/docs/plans/5_release_docker_image/plan.md
# Plan: Release Docker Image (Issue #5)

## Objective

Provide an automated, reproducible CI flow that builds and publishes a minimal production Docker image for `darthjee/navi`. The image must contain only the production application (no specs, no dev deps), be tagged properly (git tag → versioned tag + latest), and update the Docker Hub repository description after a successful release.

## Deliverables

- `dockerfiles/production_navi/Dockerfile` (production Dockerfile)
- `DOCKERHUB_DESCRIPTION.md` at repo root
- CircleCI jobs: `build-and-release` and `update-description`
- Release helper script or commands used by CI
- Documentation: `docs/issues/5_release_docker_image.md` (updated) and this plan
- Optional: `docs/examples/sample_config.yml` (runtime config example)

## High-level Steps

1. Create a minimal production Dockerfile that:
   - Copies only the `source/` app files (exclude specs and test fixtures).
   - Installs production dependencies (Yarn) only.
   - Uses an unprivileged user where appropriate.
   - Targets a reproducible platform (linux/amd64).

2. Add `DOCKERHUB_DESCRIPTION.md` describing the image, usage and ports.

3. Add CircleCI jobs:
   - `build-and-release` (machine executor) that depends on test/lint jobs: jasmine, jasmine-dev, checks, checks-dev.
   - `update-description` that runs after `build-and-release` and pushes `DOCKERHUB_DESCRIPTION.md` to Docker Hub.

4. Securely configure CircleCI env variables:
   - `DOCKER_HUB_USERNAME`
   - `DOCKER_HUB_PASSWORD` (token preferred)

5. Add a small release script or inline job steps in CircleCI to:
   - Build image with tag from `CIRCLE_TAG` or `latest`.
   - Push both tags to Docker Hub.
   - Optionally sign or scan the image.

6. Add local verification steps and docs for maintainers.

## Detailed Tasks

- Task A — Dockerfile
  - Create `dockerfiles/production_navi/Dockerfile`.
  - Use multi-stage build:
    - Builder stage: install Yarn, copy source, run `yarn install --production=false` and build if needed.
    - Final stage: copy only built artifacts and `node_modules` production deps, use `yarn install --production` or `NODE_ENV=production yarn install --production` in builder to keep final image small.
  - Example: keep node base image aligned with `darthjee/production_node:0.2.1` or reference it.

- Task B — CircleCI
  - Modify `.circleci/config.yml` workflow `test-and-release` to require `jasmine`, `jasmine-dev`, `checks`, `checks-dev` before `build-and-release`.
  - Implement `build-and-release` using `machine: true` so Docker CLI is available.
  - Implement `update-description` that runs after `build-and-release`.

- Task C — Release script
  - Provide a script snippet in CI:
    - Determine TAG: `TAG=${CIRCLE_TAG:-latest}`
    - docker build --platform linux/amd64 -f dockerfiles/production_navi/Dockerfile -t darthjee/navi:$TAG -t darthjee/navi:latest .
    - docker login && docker push both tags
  - Ensure retry/backoff on transient push failures.

- Task D — Docker Hub description update
  - Use existing helper script if available (`docker_hub.sh`), or implement a small script that uses Docker Hub API or `hub` CLI.
  - Keep credentials in CircleCI env vars.

- Task E — Documentation & examples
  - Provide `DOCKERHUB_DESCRIPTION.md`.
  - Add example runtime config at `docs/examples/sample_config.yml`.
  - Update `docs/issues/5_release_docker_image.md` to reference these artifacts and CI behavior.

- Task F — Local verification
  - Document commands to build and run locally:
    - docker build -f dockerfiles/production_navi/Dockerfile -t darthjee/navi:local .
    - docker run --rm -p 8080:80 -v $(pwd)/docker_volumes/config:/app/config darthjee/navi:local

## Example Dockerfile (multi-stage — minimal)

```dockerfile
# Builder stage
FROM darthjee/production_node:0.2.1 AS build
WORKDIR /app
COPY source/package.json source/yarn.lock ./
RUN yarn install --frozen-lockfile
COPY source/ ./
# If build step needed (e.g. transpile), run it here
# RUN yarn build

# Production image
FROM node:18-alpine
ENV NODE_ENV=production
WORKDIR /app
# Copy only necessary artifacts and production node_modules
COPY --from=build /app /app
RUN yarn install --production --frozen-lockfile --network-timeout 100000
USER node
EXPOSE 80
CMD ["node", "bin/navi.js"]
```

Notes: adapt base images to match `darthjee/production_node` philosophy. Keep image small and reproducible.

## Example CircleCI job snippets

Add to `.circleci/config.yml`:

```yaml
  build-and-release:
    machine: true
    steps:
      - checkout
      - run:
          name: Build and push Docker image
          command: |
            TAG=${CIRCLE_TAG:-latest}
            docker build --platform linux/amd64 -f dockerfiles/production_navi/Dockerfile . -t darthjee/navi:$TAG -t darthjee/navi:latest
            echo "$DOCKER_HUB_PASSWORD" | docker login -u "$DOCKER_HUB_USERNAME" --password-stdin
            docker push darthjee/navi:$TAG
            docker push darthjee/navi:latest

  update-description:
    machine: true
    steps:
      - checkout
      - run:
          name: Update Docker Hub description
          command: |
            /bin/sh /home/scripts/sbin/docker_hub.sh login_and_push_description darthjee/navi DOCKERHUB_DESCRIPTION.md
```

Ensure workflow `build-and-release` has `requires: [jasmine, jasmine-dev, checks, checks-dev]`.

## Testing & Verification

- CI must pass: unit tests (source & dev), lint, duplication checks.
- After merge to main:
  - Verify CircleCI job ran `build-and-release`.
  - Confirm docker hub tags: `latest` and versioned tag (if pushed).
  - Confirm Docker Hub description updated.
- Local verification:
  - Build image locally and run smoke tests (health endpoint, basic request using sample_config).

## Security & Secrets

- Never commit credentials. Use CircleCI project environment variables.
- Prefer Docker Hub access tokens over account passwords.
- Limit token scope if possible.

## Rollout & Rollback

- Initial rollout pushes `latest`. For releases use git tag to push versioned image.
- If release is faulty, remove the tag on Docker Hub and fix CI/Dockerfile; do not rely on `latest` as immutable.

## Acceptance Criteria (measurable)

- [ ] `dockerfiles/production_navi/Dockerfile` exists and builds a minimal production image.
- [ ] `.circleci/config.yml` contains `build-and-release` and `update-description` jobs; `build-and-release` requires tests/lint jobs.
- [ ] CircleCI uses `machine: true` for `build-and-release`.
- [ ] Push works: merging to `main` pushes `darthjee/navi:latest`.
- [ ] Creating a git tag pushes `darthjee/navi:<tag>` and `latest`.
- [ ] `DOCKERHUB_DESCRIPTION.md` exists and is applied by `update-description`.
- [ ] Documentation updated with local build/run instructions and sample runtime config.

## Timeline & Milestones

- Day 1: Create Dockerfile + DOCKERHUB_DESCRIPTION.md; local build verification.
- Day 2: Add CI jobs + env vars; test on feature branch.
- Day 3: Finalize docs, sample config, and merge.

---

If you want, I can generate:
- a starter `dockerfiles/production_navi/Dockerfile`,
- the CircleCI job YAML snippet ready to paste into `.circleci/config.yml`,
- and a small release shell script for CI. Which
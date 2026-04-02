# Release Docker Image (#5)

Issue Link: <https://github.com/darthjee/navi/issues/5>

## Problem

We need to build and publish a production Docker image for `navi` containing only the application source (no specs or dev dependencies), push it to Docker Hub, and keep its repository description up to date.

## Production Image

- Base image: `darthjee/production_node:0.2.1`
- Dockerfile: `dockerfiles/production_navi/Dockerfile`
- Docker Hub image: `darthjee/navi`
- Requirements:
  - Copy only the `source/` application files into the image (exclude `spec/`).
  - Install production dependencies with Yarn.
  - Produce a small, reproducible image for `linux/amd64`.

## CircleCI Release Flow

The release is automated via CircleCI. Add two new jobs — `build-and-release` and `update-description` — that run on the `main` branch after all checks succeed.

Workflow sketch:

```yaml
workflows:
  test-and-release:
    jobs:
      - jasmine
      - jasmine-dev
      - checks
      - checks-dev
      - build-and-release:
          requires: [jasmine, jasmine-dev, checks, checks-dev]
          filters:
            branches:
              only: main
      - update-description:
          requires: [build-and-release]
          filters:
            branches:
              only: main
```

### `build-and-release` job

- Use `machine: true` so Docker is available.
- Build the image and tag it with the git tag when present (`CIRCLE_TAG`), otherwise tag as `latest`.
- Push both the versioned tag and the `latest` tag.

Example commands used by the job:

```bash
TAG=${CIRCLE_TAG:-latest}
docker build --platform linux/amd64 \
  -f dockerfiles/production_navi/Dockerfile . \
  -t darthjee/navi:$TAG \
  -t darthjee/navi:latest

echo "$DOCKER_HUB_PASSWORD" | docker login -u "$DOCKER_HUB_USERNAME" --password-stdin
docker push darthjee/navi:$TAG
docker push darthjee/navi:latest
```

### `update-description` job

- Use a helper image (or script) to push `DOCKERHUB_DESCRIPTION.md` to Docker Hub.
- Run after `build-and-release` succeeds.

Example step:

```bash
/bin/sh /home/scripts/sbin/docker_hub.sh login_and_push_description darthjee/navi DOCKERHUB_DESCRIPTION.md
```

## Required CircleCI Environment Variables

- `DOCKER_HUB_USERNAME` — Docker Hub account username
- `DOCKER_HUB_PASSWORD` — Docker Hub account password or token

Set these in CircleCI project settings under **Environment Variables**.

## Required Files

- `dockerfiles/production_navi/Dockerfile` — production image definition
- `DOCKERHUB_DESCRIPTION.md` — repository description for Docker Hub
- `.circleci/config.yml` — updated to include `build-and-release` and `update-description` jobs

## Acceptance Criteria

- [ ] `dockerfiles/production_navi/Dockerfile` created and copies only `source/` app files (excluding `spec/`).
- [ ] `DOCKERHUB_DESCRIPTION.md` exists at project root.
- [ ] `.circleci/config.yml` includes `build-and-release` and `update-description` jobs wired into the `test-and-release` workflow.
- [ ] `DOCKER_HUB_USERNAME` and `DOCKER_HUB_PASSWORD` configured in CircleCI.
- [ ] Merging to `main` triggers a successful build and pushes `darthjee/navi:latest` to Docker Hub.
- [ ] Creating a git tag triggers a push of `darthjee/navi:<tag>` alongside `latest`.
- [ ] Docker Hub description is updated automatically after each successful release.

## Notes and Recommendations

- Keep the production Dockerfile minimal: install only production deps with `yarn install --production` and copy only required files.
- Prefer explicit platform targeting (`--platform linux/amd64`) for CI reproducibility.
- Ensure CI job uses `machine: true` to avoid Docker-in-Docker complexity.
```// filepath: /Users/darthjee/projetos/mine/navi/docs/issues/5_release_docker_image.md
# Release Docker Image (#5)

Issue Link: <https://github.com/darthjee/navi/issues/5>

## Problem

We need to build and publish a production Docker image for `navi` containing only the application source (no specs or dev dependencies), push it to Docker Hub, and keep its repository description up to date.

## Production Image

- Base image: `darthjee/production_node:0.2.1`
- Dockerfile: `dockerfiles/production_navi/Dockerfile`
- Docker Hub image: `darthjee/navi`
- Requirements:
  - Copy only the `source/` application files into the image (exclude `spec/`).
  - Install production dependencies with Yarn.
  - Produce a small, reproducible image for `linux/amd64`.

## CircleCI Release Flow

The release is automated via CircleCI. Add two new jobs — `build-and-release` and `update-description` — that run on the `main` branch after all checks succeed.

Workflow sketch:

```yaml
workflows:
  test-and-release:
    jobs:
      - jasmine
      - jasmine-dev
      - checks
      - checks-dev
      - build-and-release:
          requires: [jasmine, jasmine-dev, checks, checks-dev]
          filters:
            branches:
              only: main
      - update-description:
          requires: [build-and-release]
          filters:
            branches:
              only: main
```

### `build-and-release` job

- Use `machine: true` so Docker is available.
- Build the image and tag it with the git tag when present (`CIRCLE_TAG`), otherwise tag as `latest`.
- Push both the versioned tag and the `latest` tag.

Example commands used by the job:

```bash
TAG=${CIRCLE_TAG:-latest}
docker build --platform linux/amd64 \
  -f dockerfiles/production_navi/Dockerfile . \
  -t darthjee/navi:$TAG \
  -t darthjee/navi:latest

echo "$DOCKER_HUB_PASSWORD" | docker login -u "$DOCKER_HUB_USERNAME" --password-stdin
docker push darthjee/navi:$TAG
docker push darthjee/navi:latest
```

### `update-description` job

- Use a helper image (or script) to push `DOCKERHUB_DESCRIPTION.md` to Docker Hub.
- Run after `build-and-release` succeeds.

Example step:

```bash
/bin/sh /home/scripts/sbin/docker_hub.sh login_and_push_description darthjee/navi DOCKERHUB_DESCRIPTION.md
```

## Required CircleCI Environment Variables

- `DOCKER_HUB_USERNAME` — Docker Hub account username
- `DOCKER_HUB_PASSWORD` — Docker Hub account password or token

Set these in CircleCI project settings under **Environment Variables**.

## Required Files

- `dockerfiles/production_navi/Dockerfile` — production image definition
- `DOCKERHUB_DESCRIPTION.md` — repository description for Docker Hub
- `.circleci/config.yml` — updated to include `build-and-release` and `update-description` jobs

## Acceptance Criteria

- [ ] `dockerfiles/production_navi/Dockerfile` created and copies only `source/` app files (excluding `spec/`).
- [ ] `DOCKERHUB_DESCRIPTION.md` exists at project root.
- [ ] `.circleci/config.yml` includes `build-and-release` and `update-description` jobs wired into the `test-and-release` workflow.
- [ ] `DOCKER_HUB_USERNAME` and `DOCKER_HUB_PASSWORD` configured in CircleCI.
- [ ] Merging to `main` triggers a successful build and pushes `darthjee/navi:latest` to Docker Hub.
- [ ] Creating a git tag triggers a push of `darthjee/navi:<tag>` alongside `latest`.
- [ ] Docker Hub description is updated automatically after each successful release.

## Notes and Recommendations

- Keep the production Dockerfile minimal: install only production deps with `yarn install --production` and copy only required files.
- Prefer explicit platform targeting (`--platform linux/amd64`) for CI reproducibility.
- Ensure CI job uses `machine: true` to avoid Docker-in-Docker complexity.
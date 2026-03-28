# Release Docker Image (#5)

Issue Link: https://github.com/darthjee/navi/issues/5

## Problem

We need to build and publish a production Docker image for navi containing only the application source (without specs or dev dependencies), push it to Docker Hub, and keep its description up to date.

## Production Image

- **Base image:** `darthjee/production_node:0.2.1`
- **Dockerfile:** `dockerfiles/production_navy/Dockerfile`
- **Reference:** inspired by `dockerfiles/dev_navy/Dockerfile`, but without development packages
- **Docker Hub image:** `darthjee/navi`

## CircleCI Release Flow

The release is automated via CircleCI. The updated `.circleci/config.yml` adds two new jobs — `build-and-release` and `update-description` — that run only on the `main` branch after all checks pass.

### Workflow

```
jasmine ──┐
          ├──► build-and-release ──► update-description
checks  ──┘
```

- `jasmine` and `checks` run on every push and every tag.
- `build-and-release` runs only on `main` (and tags), after both `jasmine` and `checks` succeed.
- `update-description` runs only on `main` (and tags), after `build-and-release` succeeds.

### Updated workflow definition

```yaml
workflows:
  test-and-release:
    jobs:
      - jasmine:
          filters:
            tags:
              only: /.*/
      - checks:
          filters:
            tags:
              only: /.*/
      - build-and-release:
          requires: [jasmine, checks]
          filters:
            tags:
              only: /.*/
            branches:
              only:
                - main
      - update-description:
          requires: [build-and-release]
          filters:
            tags:
              only: /.*/
            branches:
              only:
                - main
```

### `build-and-release` job

Uses `machine: true` so that Docker commands are available directly (no Docker-in-Docker limitations).

The image is tagged with `CIRCLE_TAG` when triggered by a git tag, falling back to `latest` on regular `main` pushes. Both the versioned tag and `latest` are always pushed.

```yaml
build-and-release:
  machine: true
  steps:
    - checkout
    - run:
        name: Docker build
        command: |
          TAG=${CIRCLE_TAG:-latest}
          docker build --platform linux/amd64 \
            -f dockerfiles/production_navy/Dockerfile . \
            -t darthjee/navi:$TAG \
            -t darthjee/navi:latest
    - run:
        name: Docker login
        command: echo "$DOCKER_HUB_PASSWORD" | docker login -u "$DOCKER_HUB_USERNAME" --password-stdin
    - run:
        name: Docker push (versioned tag)
        command: |
          TAG=${CIRCLE_TAG:-latest}
          docker push darthjee/navi:$TAG
    - run:
        name: Docker push (latest)
        command: docker push darthjee/navi:latest
```

### `update-description` job

Uses the `darthjee/scripts` image, which provides a helper script that logs in to Docker Hub and pushes the repository description from `DOCKERHUB_DESCRIPTION.md`.

```yaml
update-description:
  docker:
    - image: darthjee/scripts:0.6.0
  steps:
    - checkout
    - run:
        name: Docker push description
        command: /bin/sh /home/scripts/sbin/docker_hub.sh login_and_push_description darthjee/navi DOCKERHUB_DESCRIPTION.md
```

## Required CircleCI Environment Variables

| Variable | Description |
|----------|-------------|
| `DOCKER_HUB_USERNAME` | Docker Hub account username |
| `DOCKER_HUB_PASSWORD` | Docker Hub account password or access token |

These must be set in the CircleCI project settings under **Environment Variables**.

## Required Files

| File | Description |
|------|-------------|
| `dockerfiles/production_navy/Dockerfile` | Production image definition (no dev packages, no specs) |
| `DOCKERHUB_DESCRIPTION.md` | Markdown content to be published as the Docker Hub repository description |

## Acceptance Criteria

- [ ] `dockerfiles/production_navy/Dockerfile` created based on `darthjee/production_node:0.2.1`, copying only `source/` app files (excluding `spec/`)
- [ ] `DOCKERHUB_DESCRIPTION.md` created at the project root
- [ ] `.circleci/config.yml` updated with `build-and-release` and `update-description` jobs
- [ ] `DOCKER_HUB_USERNAME` and `DOCKER_HUB_PASSWORD` configured in CircleCI project settings
- [ ] Merging to `main` triggers a successful build and pushes `darthjee/navi:latest` to Docker Hub
- [ ] Creating a git tag triggers a push of `darthjee/navi:<tag>` alongside `latest`
- [ ] Docker Hub description is updated after each successful release

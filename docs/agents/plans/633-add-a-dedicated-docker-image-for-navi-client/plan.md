# Plan: Add a dedicated docker image for navi client

Issue: [633-add-a-dedicated-docker-image-for-navi-client.md](../../issues/633-add-a-dedicated-docker-image-for-navi-client.md)

## Overview

Add a new, dedicated `darthjee/navi-hey-client` Docker image (own Dockerfile, `CMD`-based) that wraps the `navi-hey-client` npm package, released automatically off the existing `client-x.y.z` git tag alongside the npm publish. Wire it into the Makefile and CircleCI the same way `darthjee/navi-hey` already is, document it (installation guide + Docker Hub description + a README table row), and reuse existing credentials/scripts wherever possible.

## Agents involved

- [docker](docker.md)
- [docs](docs.md)

Root-level/cross-cutting files (`Makefile`, `.circleci/config.yml`, `scripts/update-description-client.sh`) are outside every specialist agent's declared scope (the `docker` agent's scope is limited to `dockerfiles/` and the root `docker-compose.yml`; it does not cover the `Makefile` or CI config) and are implemented directly by the architect — see "Root-level changes (architect)" below.

## Shared contracts

These exact values/paths cross agent boundaries and must match everywhere they're referenced:

- **Image name**: `darthjee/navi-hey-client`
- **Dockerfile path**: `dockerfiles/production_navi_client/Dockerfile` (produced by `docker`, referenced by the architect's `Makefile`/`DOCKERFILE_PROD_CLIENT` and by `docs`' documentation)
- **Build arg**: `CLIENT_VERSION` (default `latest`), used as `npm install -g navi-hey-client@${CLIENT_VERSION}`
- **Default container command**: `CMD navi-client` — **not** `ENTRYPOINT`. This means every invocation example (docs, Docker Hub description) must spell out `navi-client` explicitly as part of the command (e.g. `docker run --rm darthjee/navi-hey-client:latest navi-client --base-url ... --action ...`, or `run: navi-client --base-url ...` in a CircleCI step) — it is never implicit.
- **Tags pushed**: `darthjee/navi-hey-client:<version>` and `darthjee/navi-hey-client:latest`, where `<version>` is the `client-x.y.z` git tag with the `client-` prefix stripped (same value already validated against `clients/node/package.json` by the existing `scripts/check_client_tag_version.sh` — no changes needed to that script).
- **CLI flags** (unchanged, already implemented in `clients/node/lib/CliArgumentsParser.js`): `--base-url/-b`, `--token/-t`, `--action/-a`, `--payload/-p`. No client code changes are needed for this issue — the `navi-client` specialist agent has no work here.
- **Docker Hub description file**: `DOCKERHUB_DESCRIPTION_CLIENT.md` at repo root (produced by `docs`, referenced by the architect's `scripts/update-description-client.sh`).

## Root-level changes (architect)

### Makefile

Add new variables and targets mirroring the existing app ones exactly:

```makefile
DOCKERFILE_PROD_CLIENT ?= dockerfiles/production_navi_client/Dockerfile
CLIENT_IMAGE := darthjee/navi-hey-client
```

```makefile
build-client:
	docker build -f $(DOCKERFILE_PROD_CLIENT) . -t $(CLIENT_IMAGE):latest

build-image-client:
	@if [ -z "$(TAG)" ]; then echo "TAG not set (use TAG=<tag> make build-image-client)"; exit 1; fi
	docker build --platform $(PLATFORM) -f $(DOCKERFILE_PROD_CLIENT) --build-arg CLIENT_VERSION=$(TAG) . -t $(CLIENT_IMAGE):$(TAG) -t $(CLIENT_IMAGE):latest

release-client:
	@if [ -z "$(TAG)" ]; then echo "TAG not set (use TAG=<tag> make release-client)"; exit 1; fi
	$(MAKE) build-image-client TAG=$(TAG)
	@echo "$$DOCKER_HUB_PASSWORD" | docker login -u "$$DOCKER_HUB_USERNAME" --password-stdin
	docker push $(CLIENT_IMAGE):$(TAG)
	docker push $(CLIENT_IMAGE):latest

update-description-client:
	/bin/sh $(DOCKER_HUB_SCRIPT) login_and_push_description $(CLIENT_IMAGE) DOCKERHUB_DESCRIPTION_CLIENT.md
```

Add `build-client`/`build-image-client`/`release-client`/`update-description-client` to the `.PHONY` line alongside the existing targets. `PLATFORM` and `DOCKER_HUB_SCRIPT` are already defined and reusable as-is.

Note: `update-description-client` as a Makefile target is optional — the CircleCI job can also just call `scripts/update-description-client.sh` directly (mirroring how the existing `update-description` CircleCI job calls `scripts/update-description.sh` directly, without going through `make update-description`... actually `make update-description` *does* exist and is unused by CI, which calls the script directly). Match whichever is simpler; either works since the script is the same either way.

### scripts/update-description-client.sh

New file, mirroring `scripts/update-description.sh`:

```sh
#!/bin/sh
/bin/sh /home/scripts/sbin/docker_hub.sh login_and_push_description darthjee/navi-hey-client DOCKERHUB_DESCRIPTION_CLIENT.md
```

Make it executable (`chmod +x`), matching the existing script's permissions.

### .circleci/config.yml

1. Add three new jobs under the `jobs:` key, after `npm-publish-client` (around line 331 in the current file, next to `build-and-release`):

```yaml
  build-and-release-client:
    machine: true
    steps:
      - checkout
      - run:
          name: Build and release client image
          command: make release-client TAG=$(echo $CIRCLE_TAG | sed 's/^client-//')

  update-description-client:
    docker:
      - image: darthjee/scripts:0.6.0
    steps:
      - checkout
      - run:
          name: Update client Docker Hub description
          command: sh scripts/update-description-client.sh
```

2. Add both new jobs to the `test-and-release` workflow's `jobs:` list (near the existing `npm-publish-client`/`build-and-release`/`update-description` entries):

```yaml
      - build-and-release-client:
          requires: [npm-publish-client]
          filters:
            tags:
              only: /client-\d+\.\d+\.\d+/
            branches:
              ignore: /.*/
      - update-description-client:
          requires: [build-and-release-client]
          filters:
            tags:
              only: /client-\d+\.\d+\.\d+/
            branches:
              ignore: /.*/
```

No new CircleCI context or environment variables — `build-and-release-client` reuses the same `DOCKER_HUB_USERNAME`/`DOCKER_HUB_PASSWORD` already available to `build-and-release` (check how those are currently injected — e.g. a CircleCI context on the workflow, or project-level env vars — and use the same mechanism for the new job).

## Verification

No CI job builds/lints Dockerfiles or docs pre-merge (confirmed: no `docker build` or markdown-lint step exists in `.circleci/config.yml` today), so there's nothing new to wire into pre-merge checks. Verify manually before merge:

- `make build-image-client TAG=0.0.0-test` builds successfully and `docker run --rm darthjee/navi-hey-client:0.0.0-test navi-client --help`-equivalent (or a real `--action` call against a local Navi instance) behaves as documented.
- Docs render correctly and every code sample uses the exact image name/tag/command from "Shared contracts" above.

# Docker Plan: Add a dedicated docker image for navi client

Main plan: [plan.md](plan.md)

## Shared contracts

- **Image name**: `darthjee/navi-hey-client` (the image itself is built/pushed by the architect's `Makefile`/CircleCI wiring — this agent only produces the Dockerfile).
- **Dockerfile path**: `dockerfiles/production_navi_client/Dockerfile` — this exact path is referenced by the architect's new `DOCKERFILE_PROD_CLIENT` Makefile variable, so it must not be renamed or moved without updating `plan.md`'s root-level section too.
- **Build arg**: `CLIENT_VERSION` (default `latest`) — must be named exactly this; the architect's `make build-image-client` passes `--build-arg CLIENT_VERSION=$(TAG)`.
- **Default container command**: `CMD navi-client` — no `ENTRYPOINT`. This is a deliberate, already-decided choice (see issue's "Dockerfile contents & base" section) driven by how CircleCI's docker executor ignores both `CMD` and `ENTRYPOINT` for the primary container when no override is set — do not change to `ENTRYPOINT` without re-reading that rationale.

## Implementation Steps

### Step 1 — Create the production client Dockerfile

Create `dockerfiles/production_navi_client/Dockerfile`, mirroring `dockerfiles/production_navi_hey/Dockerfile`'s shape but scoped to the client:

```dockerfile
FROM darthjee/production_node:0.2.1

ARG CLIENT_VERSION=latest

ENV NODE_ENV=production

RUN npm install -g navi-hey-client@${CLIENT_VERSION}

USER node

CMD navi-client
```

Key differences from the app's Dockerfile (deliberate, do not carry these over):
- No `ENV NAVI_CONFIG`/`PORT`/`LOGS_PAGE_SIZE`/etc. — the client CLI (`clients/node/lib/CliArgumentsParser.js`) has no env-var fallback, only flags, so baking in env defaults would be dead weight.
- No `COPY .../config/web.yml` — there is no config file for a stateless CLI client.
- `CMD navi-client` (bare command, no flags) instead of `CMD navi-hey -c $NAVI_CONFIG` — the client always needs explicit `--base-url`/`--token`/`--action` per invocation, so there's no meaningful default beyond naming the binary.

### Step 2 — Sanity-check the image locally

Not part of any CI job (none exists for Dockerfiles today), but before considering this done, build and run it manually:

```bash
docker build -f dockerfiles/production_navi_client/Dockerfile --build-arg CLIENT_VERSION=<a published navi-hey-client version> -t navi-hey-client:test .
docker run --rm navi-hey-client:test navi-client --base-url http://localhost:3000 --token <token> --action engine-stop
```

Confirm:
- The image builds on top of `darthjee/production_node:0.2.1` without errors.
- `navi-client` is on `PATH` for the non-root `node` user (i.e. the global npm install + `USER node` combination doesn't produce a permissions issue).
- Passing flags after the image name works as expected (i.e. `docker run --rm image navi-client --base-url ...` — remember there is no `ENTRYPOINT`, so `navi-client` must be typed explicitly).

## Files to Change

- `dockerfiles/production_navi_client/Dockerfile` — new file (see Step 1).

## Notes

- This agent does not touch `Makefile`, `.circleci/config.yml`, or any docs file — those are handled by the architect (`Makefile`/CI) and the `docs` agent respectively; see `plan.md`.
- The `darthjee/production_node:0.2.1` base image is external (not part of this repo) — assumed already available/pullable, same as it already is for `production_navi_hey/Dockerfile`.

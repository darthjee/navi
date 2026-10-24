# Docker Plan: Rename worker/ folder to deku-swarm/

Main plan: [plan.md](plan.md)

## Shared contracts

- Container path is `/home/node/deku-swarm`. `source/`'s `file:../deku-swarm` link resolves relative to `/home/node/source` (compose) and `/home/node/app` (`navi-hey-test` image), so the package must sit at `/home/node/deku-swarm`.
- The `engine` agent regenerates `source/` lockfiles inside these containers, so it needs this change first.

## Implementation Steps

### Step 1 — Update mounts and COPY targets
- `docker-compose.yml`: both `./worker:/home/node/worker` mounts (the `base` anchor and `navi_extensions_app`) become `./deku-swarm:/home/node/deku-swarm`.
- `dockerfiles/navi-hey-test/Dockerfile`: `COPY --chown=node:node ./worker/ /home/node/worker/` becomes `COPY --chown=node:node ./deku-swarm/ /home/node/deku-swarm/`. Check the `readlink` block right after it for any hard-coded `/home/node/worker` path.

## Files to Change
- `docker-compose.yml` — two volume mounts.
- `dockerfiles/navi-hey-test/Dockerfile` — `COPY` source/target.

## Notes
- Validate with `docker compose config` and by bringing up `navi_app` once the engine lockfiles are in place.

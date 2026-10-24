# Docker Plan: Rename logger/ folder to deku-sprout/

Main plan: [plan.md](plan.md)

## Shared contracts

- Relies on `deku-sprout/` existing (logger step).
- Produces the container path `/home/node/deku-sprout`. The `file:../deku-sprout` links in `source/` (`/home/node/source` or `/home/node/app`) and `dev/app` resolve to it, so mount and `COPY` targets must use exactly this path.

## Implementation Steps

### Step 1: docker-compose mounts

In `docker-compose.yml:8,43,94`, change `./logger:/home/node/logger` → `./deku-sprout:/home/node/deku-sprout`. Leave the `./worker:/home/node/worker` mounts alone (#1001).

### Step 2: Dockerfile COPYs

- `dockerfiles/demo_dev_app/Dockerfile:16`: `COPY --chown=node:node ./logger/ /home/node/logger/` → `COPY --chown=node:node ./deku-sprout/ /home/node/deku-sprout/`.
- `dockerfiles/navi-hey-test/Dockerfile:30`: same change. Leave line 29 (`worker`) alone.
- Check that no later stage or script refers to `/home/node/logger` (e.g. symlink checks like the `deku-swarm` one at `navi-hey-test/Dockerfile:32`).

## Files to Change

- `docker-compose.yml`: 3 mounts
- `dockerfiles/demo_dev_app/Dockerfile`: `COPY` source and target
- `dockerfiles/navi-hey-test/Dockerfile`: `COPY` source and target

## Notes

- Developers' existing `docker_volumes/node_modules*` hold `deku-sprout` symlinks to the old path, so they must reinstall dependencies. The coordinator puts this in the PR description.

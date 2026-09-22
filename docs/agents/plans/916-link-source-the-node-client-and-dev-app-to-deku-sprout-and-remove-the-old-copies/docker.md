# Docker Plan: Link source, the Node client and dev/app to deku-sprout and remove the old copies

Main plan: [plan.md](plan.md)

## Shared contracts

- Wires `engine`'s and `dev`'s new `"deku-sprout": "file:../logger"` dependencies into every place that actually installs `source/` or `dev/app` dependencies from a bare checkout, mirroring the existing `deku-swarm`/`worker` handling exactly.
- `navi-client`'s dependency is a normal published-npm range, so it needs no Docker/compose wiring of its own.

## Implementation Steps

### Step 1 — Wire the new local dependency into docker-compose.yml

Add `./logger:/home/node/logger` to the `base` service's `volumes` in `docker-compose.yml` (the `&base` anchor, already inherited by `base_build`, `navi_app`, `navi_extensions_app`, `navi_tests`), mirroring the existing `./worker:/home/node/worker` line — resolves `source/`'s new `file:../logger` dependency for every one of those services.

Add the same `./logger:/home/node/logger` mount to the `navi_dev_app` service's `volumes` — resolves `dev/app`'s new `file:../logger` dependency.

### Step 2 — Wire the dependency into the Dockerfiles that install from a bare checkout

- `dockerfiles/navi-hey-test/Dockerfile`: in the `backend_builder` stage, add `COPY --chown=node:node ./logger/ /home/node/logger/` alongside the existing `COPY --chown=node:node ./worker/ /home/node/worker/`, and extend the post-`yarn_builder.sh` symlink check to also convert `node_modules/deku-sprout` from a symlink to a real copy, mirroring the existing `deku-swarm` block.
- `dockerfiles/demo_dev_app/Dockerfile`: add `COPY --chown=node:node ./logger/ /home/node/logger/` before `RUN yarn install --production` in the `builder` stage, then convert the resulting `node_modules/deku-sprout` symlink to a real copy before the final `COPY --from=builder` step — only `/home/node/app/` is copied into the final stage, so a bare symlink to `/home/node/logger` would otherwise break there, exactly the concern `navi-hey-test` already handles for `deku-swarm`.
- `dockerfiles/dev_app/Dockerfile` and `dockerfiles/dev_navi_hey/Dockerfile`: no change — both only warm the yarn cache from `package.json`/`yarn.lock` at build time (same precedent as today's `deku-swarm`/`worker` handling); the actual `file:` install happens later, against the compose-mounted sibling folder from Step 1.

## Files to Change

- `docker-compose.yml` — add the `./logger:/home/node/logger` mounts (`base` anchor and `navi_dev_app`)
- `dockerfiles/navi-hey-test/Dockerfile` — `COPY ./logger/` + symlink-to-copy fix in `backend_builder`
- `dockerfiles/demo_dev_app/Dockerfile` — `COPY ./logger/` + symlink-to-copy fix in `builder`

## Notes

- These changes are inert on their own — they only matter once `engine`'s and `dev`'s `package.json` changes land, and vice versa; verify end to end together (`docker compose run --rm navi_app yarn install`, a `navi-hey-test` build, and a `demo_dev_app` build) rather than in isolation.
- `dockerfiles/production_navi_hey/Dockerfile` and `dockerfiles/production_navi_client/Dockerfile` install `navi-hey`/`navi-hey-client` from the npm registry (`npm install -g navi-hey@...`), so `deku-sprout` arrives as a normal transitive dependency there — no change expected, but confirm during implementation that the published `navi-hey`/`navi-hey-client` package.json actually lists a registry version range for `deku-sprout` (not a leftover `file:` path) once `engine`/`navi-client`'s changes are published.
- No CI job builds these images on every PR (the `build-and-release*` jobs are tag-gated), so there is no `## CI Checks` entry to add here — verification is manual/local (`make build-navi-hey-test`, `docker build -f dockerfiles/demo_dev_app/Dockerfile .`, etc.) or happens naturally on the next tagged release.

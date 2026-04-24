# Plan: Docker

## New Dockerfile — `dockerfiles/dev_frontend_app/Dockerfile`

Based on `dockerfiles/dev_app/Dockerfile`. Copies `dev/frontend/package.json` and `yarn.lock` so the yarn cache layer is built separately from source:

```dockerfile
FROM darthjee/scripts:0.6.0 as scripts
FROM darthjee/node:0.2.1 as base

USER root
RUN apt-get update && apt-get install -y rsync && rm -rf /var/lib/apt/lists/*
USER node

COPY --chown=node:node \
  ./dev/frontend/package.json ./dev/frontend/yarn.lock \
  /home/node/app/

######################################

FROM base as builder

ENV HOME_DIR /home/node

USER root
COPY --chown=node:node --from=scripts /home/scripts/builder/yarn_builder.sh /usr/local/sbin/yarn_builder.sh
RUN /bin/bash yarn_builder.sh

#######################
# FINAL IMAGE
FROM base
ENV HOME_DIR /home/node

COPY --chown=node:node --from=builder /home/node/yarn/new/ /usr/local/share/.cache/yarn/v6/

USER node
```

## `docker-compose.yml` — new service `navi_dev_frontend`

Add a new service after `navi_dev_app`:

```yaml
navi_dev_frontend:
  image: navi_dev_frontend:dev
  build:
    context: .
    dockerfile: dockerfiles/dev_frontend_app/Dockerfile
  command: yarn build
  volumes:
    - ./dev/frontend/:/home/node/app/
    - ./docker_volumes/node_modules_dev_frontend:/home/node/app/node_modules
    - ./dev/proxy/static:/home/node/app/dist
```

## `docker-compose.yml` — update `navi_proxy`

Add `depends_on: [navi_dev_frontend]` so the proxy waits for the build to finish before starting:

```yaml
navi_proxy:
  image: darthjee/tent:0.5.0
  depends_on: [navi_dev_app, navi_dev_frontend]
  ...
```

## Host directory

Create `dev/proxy/static/` on the host (empty, with `.gitkeep`) so the bind mount works:

```
dev/proxy/static/.gitkeep
```

## Notes

- `command: yarn build` runs the Vite build once and exits. The output lands in `/home/node/app/dist` which is bind-mounted to `./dev/proxy/static/` on the host, making it immediately available to `navi_proxy`.
- If live reloading during development is desired in the future, `command` can be changed to `yarn server` and a port can be exposed — but that is out of scope for this issue.
- The node_modules volume `node_modules_dev_frontend` follows the same pattern as `node_modules_dev` used by `navi_dev_app`.

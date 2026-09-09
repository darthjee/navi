# `navi_extensions_app` compose service + volume scaffold

Add a dedicated service that boots the Navi engine on the `navi:dev` image with
the built worked example mounted, plus the `docker_volumes/extensions/` scaffold
for the ad-hoc bind-mount workflow the guide documents.

## What to do

In `docker-compose.yml`, add a sibling service (leave `navi_app` otherwise
untouched; only remove its stale commented extensions block, keeping a one-line
`# see docs/guides/navi/extending-navi.md` pointer):

```yaml
  navi_extensions_app:
    <<: *base
    container_name: navi_extensions_app
    depends_on: [base_build]
    working_dir: /home/node/app
    command: node bin/navi.js -c config/navi_config.yml -m config/menu.yml
    environment:
      NAVI_EXTENSIONS_ENABLED: "true"
    volumes:
      - ./source:/home/node/app
      - ./worker:/home/node/worker
      - ./docker_volumes/config:/home/node/app/config
      - ./docker_volumes/node_modules:/home/node/app/node_modules
      - ./examples/navi-orders-extension/dist:/navi/extensions:ro
      - ./examples/navi-orders-extension/config/menu.yml:/home/node/app/config/menu.yml:ro
    ports:
      - 0.0.0.0:3040:3000
```

- The four `*base` mounts are repeated verbatim because a per-service `volumes:`
  replaces the anchor's list (compose does not merge sequences).
- `command` — the dev image sets no CMD; every other compose service overrides
  it. Verify the exact entrypoint (`bin/navi.js` vs `node_modules/.bin/navi-hey`)
  against `source/package.json` `bin` and `dockerfiles/dev_navi_hey/Dockerfile`.
- Menu: the example's `config/menu.yml` is mounted **over**
  `/home/node/app/config/menu.yml`, so `-m config/menu.yml` (the prod default,
  per the `docs` reconciliation) picks it up and serves **Logs, Memory, Orders**.
- Config: uses the existing `docker_volumes/config/navi_config.yml` (from
  `make setup`). If that config triggers warming that destabilises the smoke run,
  mount `./examples/navi-orders-extension/config/navi_config.yml`
  (`web.autostart: false`) over `/home/node/app/config/navi_config.yml` and tell
  the `guide` agent to add that fixture (plan.md › Notes).
- `NAVI_EXTENSIONS_DIR` is inherited from the dev Dockerfile ENV (step 01);
  default `/navi/extensions` matches the mount.

Scaffold the ad-hoc volume dir:

- `docker_volumes/extensions/backend/.gitkeep`
- `docker_volumes/extensions/frontend/.gitkeep`
- Add `docker_volumes/extensions/` (except `.gitkeep`) to `.gitignore` alongside
  the other `docker_volumes/*` bind-mount ignores.

## Files to Change

- `docker-compose.yml` — new `navi_extensions_app` service; trim the `navi_app`
  comment block.
- `docker_volumes/extensions/backend/.gitkeep` — new.
- `docker_volumes/extensions/frontend/.gitkeep` — new.
- `.gitignore` — ignore `docker_volumes/extensions/*` but keep the `.gitkeep`s.

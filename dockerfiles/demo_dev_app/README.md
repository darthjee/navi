# demo_dev_app

Docker image for the mock target store crawled by the public **navi-hey**
demo engine (`demo_navi_hey`). It packages [`dev/app`](../../dev/app) — the
Node.js mock store server — together with the built
[`dev/frontend`](../../dev/frontend) assets and the shared
`source/lib/common/` library.

## Build & deploy

Built and released by the CircleCI `build-and-release-demo-app` job, which
triggers a Render deploy for
`RENDER_SERVICE_NAME=$DEMO_APP_RENDER_SERVICE_NAME` (Render project
`navi-demo-app`).

## Config

No config env vars are required beyond what's already baked into
[`dev/app/config.yml`](../../dev/app/config.yml). Unlike `demo_navi_hey`,
this image doesn't read a `NAVI_CONFIG`-style override — it's a plain
Node.js server started with `CMD ["node", "server.js"]`.

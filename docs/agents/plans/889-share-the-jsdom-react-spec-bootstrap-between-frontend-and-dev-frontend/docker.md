# Docker Plan: Share the jsdom/React spec bootstrap between frontend and dev/frontend

Main plan: [plan.md](plan.md)

## Shared contracts

Compose mounts and image contents must match [plan.md](plan.md#shared-contracts): `spec-support/` mounted at `/home/node/spec-support` in `navi_frontend` and at `/home/spec-support` in `navi_dev_frontend` (so `file:../spec-support` and `file:../../spec-support` resolve from `/home/node/app`); and the `navi-hey-test` image keeps exposing `navi-hey/testing/dom.js` and `navi-hey/testing/fetch.js`.

## Implementation Steps

### Step 1 — Mount spec-support in the two frontend compose services
In `docker-compose.yml` add `- ./spec-support:/home/node/spec-support` to `navi_frontend` and `- ./spec-support:/home/spec-support` to `navi_dev_frontend`, next to the existing bind mounts (precedent: `./worker:/home/node/worker`). The mount is only needed for `yarn install`; specs resolve from `node_modules`. Check whether the dev image builds (`dockerfiles/dev_frontend/Dockerfile`, `dockerfiles/dev_frontend_app/Dockerfile`) still succeed with a `file:` dependency whose folder is not in the image, as the dev navi-hey image does for `worker/`; if not, copy `./spec-support/` to the matching path in those Dockerfiles.

### Step 2 — Update the navi-hey-test image
In `dockerfiles/navi-hey-test/Dockerfile`: source the reused files from `./spec-support/` instead of `./frontend/spec/support/` — `dom.js` (still baked to `/navi/node_modules/navi-hey/frontend-support/dom.js`), `loader.js` and `transform_hooks.js` (still baked to `/opt/navi-hey-test/`); `fetch.js` stays in `frontend/spec/support/`. Because `frontend/package.json` now has a `file:../spec-support` dependency, `frontend_builder` must copy `./spec-support/` to `/home/node/spec-support/` before `yarn_builder.sh` (as `backend_builder` does for `./worker/`), and — if the resulting `node_modules/navi-spec-support` is a symlink — replace it with a copy exactly like the `deku-swarm` `readlink`/`cp -R` fix so it is not dangling in the final image. Update the header comment ("the reused frontend/spec/support/* files"). `navi-hey.package.json` and `jasmine.frontend.json` keep the same baked paths, so they should need no change; confirm.

## Files to Change
- `docker-compose.yml` — spec-support mounts for `navi_frontend` and `navi_dev_frontend`
- `dockerfiles/dev_frontend/Dockerfile`, `dockerfiles/dev_frontend_app/Dockerfile` — only if the image build needs the folder
- `dockerfiles/navi-hey-test/Dockerfile` — copy sources, `frontend_builder` handling of the `file:` dependency, comment

## CI Checks
- `test-extension-harness` and `smoke-extensions` (build and run the `navi-hey-test` image and the example extension); locally via the Makefile `build-navi-hey-test` / `test-extension-harness` targets.

## Notes
- `docs/guides/navi/extending-navi.md` and `examples/navi-orders-extension/tests/frontend/orders_page_spec.jsx` import `useContainer` from `navi-hey/testing/dom.js`; this must keep working — run the extension harness end to end.
- The exact behavior of `yarn_builder.sh` with `file:` dependencies (symlink vs copy) was inferred from the existing `deku-swarm` workaround and should be verified when building the image.

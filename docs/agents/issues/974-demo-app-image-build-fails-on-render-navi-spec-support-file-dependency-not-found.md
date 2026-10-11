# Issue: Demo app image build fails on Render: navi-spec-support file dependency not found

## Description

The Navi demo app release fails when Render builds `dockerfiles/demo_dev_app/Dockerfile`. The `frontend` stage copies only `dev/frontend/` into `/home/node/app/` and then runs `yarn install && yarn build`. That fails while yarn is resolving packages:

```
#11 [frontend 3/3] RUN yarn install && yarn build
#11 0.694 [1/4] Resolving packages...
#11 0.802 error Package "navi-spec-support" refers to a non-existing file '"/home/spec-support"'.
#11 ERROR: process "/bin/sh -c yarn install && yarn build" did not complete successfully: exit code: 1
...
Dockerfile:5
   3 |     COPY --chown=node:node dev/frontend/ /home/node/app/
   5 | >>> RUN yarn install && yarn build
```

## Problem

#889 (PR #909) moved the shared jsdom/React spec bootstrap into the private `spec-support/` package and added `"navi-spec-support": "file:../../spec-support"` to `dev/frontend/package.json` `devDependencies`. From `/home/node/app/` that resolves to `/home/spec-support`.

The dev images were updated to match: `dockerfiles/dev_frontend_app/Dockerfile` copies `./spec-support/` to `/home/spec-support/`, and `docker-compose.yml` mounts it there. `dockerfiles/demo_dev_app/Dockerfile` was not updated. It is the only Dockerfile that builds a frontend without copying `spec-support/`. Yarn v1 resolves every `file:` dependency, including dev ones, so the install fails before the build starts. The frontend build needs devDependencies anyway (vite), so `--production` is not a way around it.

## Expected Behavior

- `docker build -f dockerfiles/demo_dev_app/Dockerfile .` succeeds from the repo root.
- The Render demo app release builds and deploys.
- The final image still contains only `app/` with `static/` (no `spec-support`).

## Solution

In the `frontend` stage of `dockerfiles/demo_dev_app/Dockerfile`, copy the package to the path yarn expects before running `yarn install`:

```dockerfile
COPY --chown=node:node ./spec-support/ /home/spec-support/
COPY --chown=node:node dev/frontend/ /home/node/app/
```

Only the `frontend` stage needs this. Its output is `dist/`, which the final image copies, so `spec-support` never reaches the runtime image and no symlink-to-copy step is needed (unlike the `deku-sprout` step in `builder`).

Owner: `docker` agent (`dockerfiles/`).

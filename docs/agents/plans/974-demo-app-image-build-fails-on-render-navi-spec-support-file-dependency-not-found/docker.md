# Docker Plan: Demo app image build fails on Render: navi-spec-support file dependency not found

Main plan: [plan.md](plan.md)

## Overview
The Render demo release builds `dockerfiles/demo_dev_app/Dockerfile`. Its `frontend` stage fails at `yarn install` because `dev/frontend/package.json` declares `"navi-spec-support": "file:../../spec-support"`. From `/home/node/app/` that resolves to `/home/spec-support`, and nothing copies the package there.

## Context
PR #909 (for issue #889) added the dependency and updated `dockerfiles/dev_frontend_app/Dockerfile` (`COPY ./spec-support/ /home/spec-support/`) and `docker-compose.yml`, but missed `demo_dev_app`. It is the only Dockerfile that builds a frontend without copying `spec-support/`.

## Implementation Steps

### Step 1 — Copy spec-support into the frontend stage
In `dockerfiles/demo_dev_app/Dockerfile`, add before the existing `COPY ... dev/frontend/ /home/node/app/` line:

```dockerfile
# navi-spec-support is a `file:../../spec-support` dependency of dev/frontend/,
# so the folder must exist two levels above app/ for `yarn install` to resolve it.
COPY --chown=node:node ./spec-support/ /home/spec-support/
```

The comment matches the one in `dockerfiles/dev_frontend_app/Dockerfile`. Leave the `builder` and final stages unchanged. The final image copies only `/home/node/app/dist` from `frontend`, so `spec-support` never reaches the runtime image and no symlink-to-copy step is needed.

### Step 2 — Verify the build locally
From the repo root, run `docker build -f dockerfiles/demo_dev_app/Dockerfile -t navi-demo-dev-app:test .` and confirm it succeeds. Then confirm that `/home/spec-support` does not exist in the final image: `docker run --rm navi-demo-dev-app:test ls /home` should list only `node`. If Docker is unavailable, say so in the PR instead of claiming the build was verified.

## Files to Change
- `dockerfiles/demo_dev_app/Dockerfile` — copy `./spec-support/` to `/home/spec-support/` in the `frontend` stage, before `yarn install`.

## Notes
- No CI job builds `demo_dev_app`, so CI will not catch a regression. Render's release build is the real check after merge.
- `.dockerignore` (if present) must not exclude `spec-support/`. `dev_frontend_app` already copies it from the same build context, so this should already hold.

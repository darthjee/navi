# Issue: Dev Dockerfiles run as root as last USER

## Description
Codacy/Hadolint (`DL3002`) flags that the last effective `USER` is `root` at the same line in three Dockerfiles:

- `dockerfiles/dev_app/Dockerfile:18`
- `dockerfiles/dev_frontend_app/Dockerfile:18`
- `dockerfiles/dev_navi_hey/Dockerfile:18`

Running containers as root widens the blast radius of any container-escape or dependency-compromise scenario.

_Found via Codacy/Hadolint (`Hadolint_DL3002`)._

## Problem
Investigation of all three Dockerfiles shows the flagged line (18) is always `USER root` inside the intermediate `builder` stage (used only to run `yarn_builder.sh` and expose `/home/node/yarn/new/` for a later `COPY --from=builder`). That stage never switches back to a non-root user before it ends, which is what Hadolint is actually flagging.

The final image stage in each Dockerfile already ends on `USER node` (via the shared `base` stage plus an explicit `USER node`/`USER root` → `USER node` sequence in `dev_navi_hey`), so the *running* dev containers are already non-root today. Because Docker multi-stage builds discard a stage's process/user state once it's left behind — only files explicitly `COPY --from=<stage>`'d survive — the `builder` stage's leftover root user has no effect on the final image; it's a lint-only finding, not a live root-container issue.

## Expected Behavior
Hadolint's `DL3002` no longer fires on these three Dockerfiles, with no change to the final images' runtime user (already `node` in all three).

## Solution
Add a `USER node` directive right after `RUN /bin/bash yarn_builder.sh` in the `builder` stage of:

- `dockerfiles/dev_app/Dockerfile`
- `dockerfiles/dev_frontend_app/Dockerfile`
- `dockerfiles/dev_navi_hey/Dockerfile`

This mirrors the existing `USER root` → (privileged work) → `USER node` pattern already used elsewhere in these same files. Verify afterwards that:

- the build still succeeds (the privileged `yarn_builder.sh` run completes before the switch back, so no permission issue is expected);
- artifacts copied out of `builder` via `COPY --from=builder` keep correct ownership (already enforced by the existing `--chown=node:node` on those `COPY` lines, independent of the builder stage's own user);
- the final images still run as `node` (no change expected/needed there — they already do).

## Benefits
Closes the Hadolint `DL3002` finding on all three Dockerfiles with a minimal, low-risk change that doesn't touch the already-non-root final images.

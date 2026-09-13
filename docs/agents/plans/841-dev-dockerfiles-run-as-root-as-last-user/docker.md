# Plan: Dev Dockerfiles run as root as last USER

Issue: [841-dev-dockerfiles-run-as-root-as-last-user.md](../../issues/841-dev-dockerfiles-run-as-root-as-last-user.md)

## Overview

Silence Hadolint's `DL3002` finding on `dockerfiles/dev_app/Dockerfile`, `dockerfiles/dev_frontend_app/Dockerfile`, and `dockerfiles/dev_navi_hey/Dockerfile` by switching back to the non-root `node` user at the end of each Dockerfile's intermediate `builder` stage. The final image stages already end on `USER node` in all three files, so no runtime behavior changes — this only fixes the discarded `builder` stage that Hadolint evaluates independently.

## Context

All three Dockerfiles share the same pattern:

```dockerfile
FROM base as builder

ENV HOME_DIR /home/node

USER root
COPY --chown=node:node --from=scripts /home/scripts/builder/yarn_builder.sh /usr/local/sbin/yarn_builder.sh
RUN /bin/bash yarn_builder.sh
```

`USER root` (line 18 in each file) is the last `USER` directive in the `builder` stage — the stage ends without switching back, which is what Hadolint's `DL3002` flags. Because Docker multi-stage builds discard a stage's process/user state once it's left behind (only `COPY --from=<stage>` artifacts survive into later stages), this has no effect on the final images, which already run as `node`. This is purely a lint fix.

## Implementation Steps

### Step 1 — Add `USER node` at the end of the `builder` stage

In each of the three Dockerfiles, add a `USER node` line immediately after `RUN /bin/bash yarn_builder.sh` in the `builder` stage, mirroring the existing `USER root` → (privileged work) → `USER node` pattern already used elsewhere in these same files (e.g. the `base` stage, and the final stage in `dev_navi_hey`).

Resulting `builder` stage shape (applied identically to all three files):

```dockerfile
FROM base as builder

ENV HOME_DIR /home/node

USER root
COPY --chown=node:node --from=scripts /home/scripts/builder/yarn_builder.sh /usr/local/sbin/yarn_builder.sh
RUN /bin/bash yarn_builder.sh
USER node
```

No other lines change. The `--chown=node:node` already present on every `COPY --from=builder ...` in the final stages keeps copied artifact ownership correct regardless of the `builder` stage's own user, so this switch is safe.

## Files to Change

- `dockerfiles/dev_app/Dockerfile` — add `USER node` after the `builder` stage's `RUN /bin/bash yarn_builder.sh` (currently line 20).
- `dockerfiles/dev_frontend_app/Dockerfile` — same change, same line.
- `dockerfiles/dev_navi_hey/Dockerfile` — same change, same line.

## Notes

- No CI job runs Hadolint locally (it's found via Codacy's cloud scan per the issue) — verify by re-running `hadolint dockerfiles/<name>/Dockerfile` locally if available, or by building the affected dev images (`docker compose build navi_dev_app navi_dev_frontend navi_dev_navi_hey` or the equivalent `make` targets) to confirm the build still succeeds.
- Confirm the built dev containers still run as `node` (e.g. `docker compose run --rm navi_dev_app whoami`) — expected to be unchanged since the final stages were already non-root.

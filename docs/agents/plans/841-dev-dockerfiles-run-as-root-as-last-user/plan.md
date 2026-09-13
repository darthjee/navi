# Plan: Dev Dockerfiles run as root as last USER

Issue: [841-dev-dockerfiles-run-as-root-as-last-user.md](../../issues/841-dev-dockerfiles-run-as-root-as-last-user.md)

## Overview

Fix Hadolint's `DL3002` finding on the three dev Dockerfiles by switching back to `USER node` at the end of their shared `builder` stage; the final images are already non-root, so this is a lint-only fix owned entirely by the `docker` agent.

See [docker.md](docker.md) for the full plan.

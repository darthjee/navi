# Plan: Dev Dockerfiles: unpinned apt packages / missing --no-install-recommends

Issue: [846_dev-dockerfiles--unpinned-apt-packages---missing---no-install-recommends.md](../../issues/846-dev-dockerfiles--unpinned-apt-packages---missing---no-install-recommends.md)

## Overview
Pin the `rsync` apt package version and add `--no-install-recommends` across the four dev Dockerfiles that call `apt-get`, resolving the Hadolint `DL3008`/`DL3015` findings.

See [docker.md](docker.md) for the full plan.

# Plan: Demo navi-hey engine silently ignores its config (wrong config path baked into the Dockerfile)

Issue: [773-demo-navi-hey-engine-silently-ignores-its-config--wrong-config-path-baked-into-the-dockerfile.md](../../issues/773-demo-navi-hey-engine-silently-ignores-its-config--wrong-config-path-baked-into-the-dockerfile.md)

## Overview

`dockerfiles/demo_navi_hey/Dockerfile` copies the demo's `navi-config.yml`
into the image, but the base image's inherited `CMD` never reads that file —
it reads `config/web.yml` instead, silently falling back to an empty
production default. Fix the Dockerfile to explicitly point navi-hey at the
copied config, and document both demo Dockerfiles so this doesn't silently
regress again.

See [docker.md](docker.md) for the full plan.

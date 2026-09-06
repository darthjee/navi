# Plan: demo config: collector client + parser/emit on Oak resources

Issue: [780-demo-config-collector-client-parser-emit-on-oak-resources.md](../issues/780-demo-config-collector-client-parser-emit-on-oak-resources.md)

## Overview

Wire Navi's data-extraction-and-emission feature into the public `navi-hey` demo by editing
`dockerfiles/demo_navi_hey/navi-config.yml` only: add a dedicated `collector` client and attach a
`parser` + `emit` block to four existing `oak_*` resource-request entries — one worked example per
parser type (`json_path` × 2, `css`, `regex`) — plus a README update. Config + docs + one Render
env var; no engine or dev-app code changes.

See [docker.md](docker.md) for the full plan.

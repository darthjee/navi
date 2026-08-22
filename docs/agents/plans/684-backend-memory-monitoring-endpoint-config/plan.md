# Plan: Backend: memory monitoring endpoint & config

Issue: [684-backend-memory-monitoring-endpoint-config.md](../issues/684-backend-memory-monitoring-endpoint-config.md)

## Overview

Add an unauthenticated `GET /memory/status.json` endpoint reporting the process's RSS against a
configured maximum, plus the `web.memory` config block that defines that maximum and its warning
thresholds. All work is contained in `source/`.

See [engine.md](engine.md) for the full plan.

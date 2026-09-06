# Plan: dev/app: POST /collector/:source logging endpoint

Issue: [779-dev-app-post-collector-source-logging-endpoint.md](../../issues/779-dev-app-post-collector-source-logging-endpoint.md)

## Overview

Add a logging-only `POST /collector/:source` endpoint to the demo dev app (`dev/app/`) — the
emit target for the `navi-hey` demo (sub-issue of #777). A `CollectorHandler` reads
`params.source` and the JSON body, logs `{ source, body }` via the shared `Logger`, and
responds `204`. Supporting changes: `express.json({ limit: '1mb' })` in `app.js`, a
method-aware `RouteRegister`, a small `collector_routes.config.js`, and a `FailureSimulator`
exemption so emissions never get a simulated `502`.

All work is within the `dev` agent's scope. See [dev.md](dev.md) for the full plan.

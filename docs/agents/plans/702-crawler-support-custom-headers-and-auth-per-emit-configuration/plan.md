# Plan: Crawler: support custom headers and auth per emit configuration

Issue: [702-crawler-support-custom-headers-and-auth-per-emit-configuration.md](../../issues/702-crawler-support-custom-headers-and-auth-per-emit-configuration.md)

## Overview

Add an optional `emit.headers` map to the `emit` YAML config so a single emit can send
its own auth token / `Content-Type` / routing headers without needing a dedicated
`client`. `ResourceRequestEmit` validates and exposes `headers`; `EmitJob` forwards them
to `Client#emit`, which merges them over the client's default headers with the emit
values winning on key conflicts. `$VAR` / `${VAR}` references resolve at config-load time
via the existing whole-file `EnvStringResolver` pass — no new resolver.

All work is within the `engine` specialist's scope (`source/`).

See [engine.md](engine.md) for the full plan.

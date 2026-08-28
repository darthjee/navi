# Plan: Inject a status provider into EngineStopService instead of the static Application facade

Issue: [728-inject-a-status-provider-into-enginestopservice-instead-of-the-static-application-facade.md](../issues/728-inject-a-status-provider-into-enginestopservice-instead-of-the-static-application-facade.md)

## Overview

`EngineStopService` currently calls the static `Application` facade directly. Give `stop()` a `statusProvider = Application` default parameter so it depends on an injectable abstraction instead, update its spec to inject a test double, and correct `docs/agents/worker.md`'s now-stale references to this service (path, extraction note, and an inaccurate "JobRegistry" mention). This is independent of #718's `EngineEvents` → `Engine` listener API migration.

## Agents involved

- [engine](engine.md)
- [architect](architect.md)

## Shared contracts

- `engine` finalizes `EngineStopService`'s new shape: `static stop(statusProvider = Application)`, where `statusProvider` is any object exposing `isRunning()` and `stop()`. The file stays at `source/lib/services/engine/EngineStopService.js` (no path change).
- `architect` relies on that shape being in place (or the plan description above) to know what to write in the `docs/agents/worker.md` table row — no runtime dependency between the two, since the doc change is static description, not code.

# Engine Plan: Navi: wire onWorkerIdle to Engine#wake()

Main plan: [plan.md](plan.md)

## Overview
A worker that finishes a job should wake the engine's sleep straight away, so the next ready job is allocated without waiting up to `sleepMs`. deku-swarm already provides both pieces:

- `WorkerFactory({ ..., onWorkerIdle })` calls the hook in `Worker#perform()`'s `finally`, after `setIdle`. A throwing hook is caught and logged at `warn`.
- `Engine#wake()` does nothing when the loop isn't running.

Navi only has to connect them.

## Context

- **Where things are built:** `ApplicationInstance#loadConfig()` calls `RegistriesBuilder#build({ config })`, which builds the `WorkerFactory` through the idempotent `WorkersRegistry.ensureBuild`. The `Engine` is built later, once, in `ApplicationInstance#run()` → `EngineController.build()` → `buildEngine()`.
- **Restart and reload:** these reuse the same engine instance.
- **Why the callback looks the engine up when called:** the engine doesn't exist yet when `loadConfig()` runs.
- **Scope:**
  - No extra guards: before `run()`, the optional chaining makes the hook a no-op.
  - `EngineController#waitForWorkersIdle` (pause/stop polling) stays as it is.
- **Tests:** unit specs only, with no timing assertions. End-to-end wake behavior is covered by deku-swarm's `spec/services/Engine_wake_spec.js`.

## Steps

- [01 — RegistriesBuilder: accept and forward onWorkerIdle](engine/01-registries-builder-hook.md)
- [02 — ApplicationInstance: wire the hook to the current engine](engine/02-application-instance-wiring.md)
- [03 — Bump the app version](engine/03-bump-version.md)

## CI Checks
- `source`: `npm test` and `npm run lint` (run inside `source/`, e.g. via the project's docker-compose test service as other source/ changes do)
- Root: `scripts/ci.sh cascade-bump-check` (the app version must be bumped because `source/lib` changes)

## Notes
- **Where the callback lives:** the arrow function must be created inside `ApplicationInstance#loadConfig` (or a private method), so it closes over `this` and reads the private `#engineController` field when called. Never capture `this.#engineController.engine` eagerly.
- **Test setup:** `RegistryCleanupUtils.resetApplicationState()` in specs resets `WorkersRegistry`. Because `ensureBuild` is idempotent, each spec that checks the hook must build from a reset registry, which the existing `afterEach` already guarantees.
- **Root README:** `scripts/bump_version.sh` also updates the root `README.md` Versions table. That edit is a mechanical result of the script and is accepted even though the root README is outside `source/`.
- **Docs:** no user-facing behavior or config changes, so `docs/guides/navi/` needs no update.

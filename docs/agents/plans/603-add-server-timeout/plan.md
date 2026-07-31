# Plan: Add Server idle_timeout

Issue: [603-add-server-timeout.md](../../issues/603-add-server-timeout.md)

## Overview

Add an optional `web.idle_timeout` (seconds) config setting. When set, the running application auto-shuts-down (web server included, same as `Application.shutdown()`/CI-mode exit) once it has been idle — no busy workers and no jobs in any queue — for that many seconds. The countdown naturally resets any time a job exists or a worker is busy again, since it is evaluated every `Engine` loop tick rather than tracked via a separate timer. Disabled by default (unset or `0` preserves today's "linger forever" behavior).

This is entirely within the `engine` agent's scope (`source/`) — no frontend or dev changes are required; the feature has no new API surface, and `settings.json` already only reports `enable_shutdown`.

## Context

- `source/lib/services/Engine.js` already runs an infinite loop in `keepAlive` mode (web UI present), re-evaluating `JobRegistry.hasJob()` / `WorkersRegistry.hasBusyWorker()` every tick (`#sleep()`), and already exposes the exact "queue empty and no busy workers" condition via `#continueAllocating()`. This is the natural, already-existing hook point for idle detection — no extra polling/timer infrastructure is needed.
- `source/lib/services/ApplicationInstance.js#shutdown()` already does precisely what the issue asks for on expiry: `webServer?.shutdown()` then stop the engine loop — the same path the manual `PATCH /engine/shutdown` endpoint (`EngineShutdownHandler`) uses. Auto-shutdown on idle timeout should simply invoke this same method.
- `source/lib/models/configs/WebConfig.js` currently parses `port`, `logs_page_size`, `enable_shutdown`, `autostart`, `links` — `idle_timeout` follows the same constructor-default pattern (no schema/validator layer exists in this codebase).
- Per `docs/agents/dangers.md`, timing-sensitive behavior here reads real `Date.now()` (same pattern already used in `Job.js`'s `readyBy`/`isReadyBy`), not a fake-timer harness — tests use `sleepMs: -1` (no real sleep between ticks) with a `0`/near-`0` `idleTimeoutMs` so the idle threshold is crossed within the synchronous test loop, exactly like the existing `Engine_spec.js` `keepAlive` tests that terminate the loop via a spy-driven `engine.stop()`.

## Implementation Steps

### Step 1 — `WebConfig`: parse `idle_timeout`

In `source/lib/models/configs/WebConfig.js`, accept `idle_timeout` (seconds) from the YAML config, defaulting to `0` (disabled), and expose it as `idleTimeout` (seconds) — mirroring the existing `logs_page_size` → `logsPageSize` snake_case-to-camelCase mapping. Update the constructor JSDoc.

### Step 2 — `Engine`: idle detection and auto-shutdown callback

In `source/lib/services/Engine.js`:
- Accept two new constructor params: `idleTimeoutMs` (default `0`/disabled) and `onIdleTimeout` (a callback, default no-op).
- Track idle state across loop ticks with a private field (e.g. `#idleSince`, initially `null`).
- On each iteration (only meaningful when `idleTimeoutMs > 0`), after the existing `hasReadyJob`/allocate block, compute `isIdle = !JobRegistry.hasJob() && !WorkersRegistry.hasBusyWorker()` (the same condition `#continueAllocating()` already expresses — reuse it rather than duplicating logic where practical).
  - If idle and `#idleSince` is `null`, set `#idleSince = Date.now()`.
  - If idle and `Date.now() - #idleSince >= idleTimeoutMs`, invoke `onIdleTimeout()` exactly once (guard with a private `#idleTimeoutFired` flag so a slow/async callback can't be invoked again on the next tick before the loop actually stops) and skip re-arming until reset.
  - If not idle, reset `#idleSince = null` and `#idleTimeoutFired = false` (countdown resets whenever a job/worker becomes active again, per the issue).
- `onIdleTimeout` is invoked without `await` (fire-and-forget) — the loop must keep ticking normally; whatever the callback does (calling `Application`-level shutdown) is responsible for eventually calling `engine.stop()` to end the loop, exactly like the manual shutdown endpoint already does.
- Update the class-level JSDoc to mention the new idle-timeout behavior.

### Step 3 — `ApplicationInstance`: wire config to the engine

In `source/lib/services/ApplicationInstance.js`:
- `buildEngine()`: pass `idleTimeoutMs: (this.config.webConfig?.idleTimeout ?? 0) * 1000` and `onIdleTimeout: () => this.#handleIdleTimeout()`.
- Add a small private `#handleIdleTimeout()` method that calls `this.shutdown()` — reusing the exact same shutdown path the `PATCH /engine/shutdown` endpoint uses (`webServer?.shutdown()` + engine stop), independent of `enable_shutdown` (per the issue: `idle_timeout` auto-shutdown must apply regardless of that flag), so do not gate this call on `config.webConfig.enableShutdown`.
- No change needed to `run()`/`#finishRun()` — once `engine.start()`'s loop resolves (because `shutdown()` called `engine.stop()`), the existing `#aggregator.wait()` → `#finishRun()` path already runs the normal end-of-run summary/failure-threshold logic, identically to today's CI-mode exit and to the manual-shutdown path.

### Step 4 — Tests

- `source/spec/lib/models/configs/WebConfig_spec.js`: add cases for `idle_timeout` present (parsed into `idleTimeout`) and absent (`idleTimeout` defaults to `0`).
- `source/spec/lib/services/Engine_spec.js`: add a `describe('idle timeout', ...)` (or extend the existing `when keepAlive is true` block) covering:
  - No timeout fires when `idleTimeoutMs` is `0`/unset (default — current behavior unchanged).
  - Callback fires once after the queue/workers have been idle for `idleTimeoutMs` (use `sleepMs: -1` and a `0`ms `idleTimeoutMs` so the very next non-idle-condition tick already qualifies, following the existing spy-driven `promoteReadyJobs`/`engine.stop()` termination pattern in this file).
  - Callback does **not** fire while jobs are enqueued/processing (busy worker or queued job resets/prevents the idle countdown).
  - Countdown resets after activity resumes and idles again (enqueue a job mid-idle-window, confirm no premature callback, then let it go idle again and confirm it does fire).
- `source/spec/lib/services/ApplicationInstance_spec.js`: add a test that `buildEngine()` forwards `idleTimeoutMs` computed from `config.webConfig.idleTimeout` (seconds → ms) and that triggering the wired `onIdleTimeout` callback calls `shutdown()` (spy on `ApplicationInstance.prototype.shutdown` or on the built engine's constructor args, following existing spy patterns already used in this spec file for `buildEngine`/`buildWebServer`).

### Step 5 — Documentation

- `docs/agents/web-server.md`: add `idle_timeout` to the `## Configuration` YAML example and describe the auto-shutdown behavior (idle = no busy workers and no queued/failed/retrying jobs; countdown resets on activity; disabled when unset/`0`; independent of `enable_shutdown`), matching the issue's "Solution" section.
- `docs/agents/flow/startup-and-config.md`: add `idle_timeout` to the `web:` block in the `## Configuration Structure` YAML example, with a one-line comment like the existing `autostart` line.
- `docs/agents/flow/lifecycle.md`: add a short note that in web mode, sustained idleness (governed by `web.idle_timeout`) triggers the same `running → stopped` shutdown transition as `PATCH /engine/shutdown`, ending the process — matching how the doc already calls out `web.autostart`'s effect on the initial state.

## Files to Change

- `source/lib/models/configs/WebConfig.js` — parse `idle_timeout` → `idleTimeout` (seconds, default `0`).
- `source/lib/services/Engine.js` — idle detection (`#idleSince`/`#idleTimeoutFired`) and `onIdleTimeout` invocation.
- `source/lib/services/ApplicationInstance.js` — wire `idleTimeoutMs`/`onIdleTimeout` into `buildEngine()`; add `#handleIdleTimeout()`.
- `source/spec/lib/models/configs/WebConfig_spec.js` — `idle_timeout` parsing tests.
- `source/spec/lib/services/Engine_spec.js` — idle-timeout behavior tests.
- `source/spec/lib/services/ApplicationInstance_spec.js` — wiring test.
- `docs/agents/web-server.md` — document `idle_timeout` config and behavior.
- `docs/agents/flow/startup-and-config.md` — add `idle_timeout` to the example config.
- `docs/agents/flow/lifecycle.md` — note the idle-timeout-driven shutdown transition.

## CI Checks

- `source`: `npm run coverage` (CI job: `jasmine`)
- `source`: `npm run lint` (CI job: `checks`)
- `source`: `npm run report` (CI job: `checks`)

## Notes

- `idle_timeout` is deliberately kept independent of `enable_shutdown` per the issue — the manual shutdown *button/endpoint* can be disabled while auto-idle-shutdown still applies.
- CI mode (no `web.port` at all) is unaffected: `WebConfig` (and therefore `idle_timeout`) only exists when `web.port` is configured, and `Engine`'s `keepAlive` is only `true` when a `WebConfig` is present — idle-timeout logic is effectively a no-op whenever `keepAlive` is `false`, matching the issue's "if not configured (or set to 0), current behavior... is preserved" for CI mode implicitly (CI mode already exits on empty queue with no idle-timeout involvement at all).
- No new HTTP endpoint or `settings.json` field is introduced by this issue; if a future issue wants the dashboard to display/edit `idle_timeout`, that would need `frontend` + `engine` coordination then, but is out of scope here.

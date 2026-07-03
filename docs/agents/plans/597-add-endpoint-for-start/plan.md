# Plan: Add endpoint for start

Issue: [597-add-endpoint-for-start.md](../../issues/597-add-endpoint-for-start.md)

## Overview

Add a `web.autostart` config option so the engine can boot idle (`stopped`) instead of processing immediately when the web server is enabled, and extend `PATCH /engine/start` to accept a JSON body naming which resources to enqueue — working whether the engine is `stopped` (starts it) or already `running` (pushes into the existing queue), falling back to today's "enqueue everything parameter-free" behavior when no resources are named.

This is entirely within the `engine` agent's scope (`source/`); no `frontend` or `dev` changes are required — the frontend's existing `PATCH /engine/start` call (no body, only enabled while stopped) keeps working unchanged.

## Context

Today, `ApplicationInstance.run()` (`source/lib/services/ApplicationInstance.js`) unconditionally calls `enqueueFirstJobs()` and sets status to `running` at boot. `Engine` (`source/lib/services/Engine.js`) already runs its allocation loop indefinitely when `keepAlive` is true (web mode) — the loop itself never exits; the existing `pause()`/`resume()` flags are what make status `stopped`/`paused` meaningful without tearing down the loop. `EngineStartHandler` (`source/lib/server/handlers/engine/EngineStartHandler.js`) currently takes no body, always re-enqueues every parameter-free resource, and 409s unless the engine is `stopped`. No route currently reads a request body, so no `express.json()` middleware is registered in `Router.js` yet.

## Implementation Steps

### Step 1 — `web.autostart` config option

In `WebConfig` (`source/lib/models/configs/WebConfig.js`), add `autostart` (boolean, default `true`) mirroring the existing `enable_shutdown` pattern.

### Step 2 — Skip auto-start at boot when disabled

In `ApplicationInstance.run()`, when `this.config.webConfig?.autostart` is `false`: skip `enqueueFirstJobs()`, call `this.engine.pause()`, and set status to `stopped` instead of `running`. Still build and start the engine loop and web server as today (the loop must keep ticking in `keepAlive` mode so a later `/engine/start` can resume it). When `autostart` is `true`/absent (or no `webConfig`), behavior is unchanged.

### Step 3 — Extract a name-based enqueue method

Add `ApplicationInstance#enqueueResources(names = [])`:
- Empty/omitted `names` → call the existing `enqueueFirstJobs()`; return `{ enqueued: [], skippedResources: [] }`.
- Non-empty `names` → for each name: look up the `Resource` via `ResourceRegistry`; if not found, push `{ name, reason: 'not_found' }` to `skippedResources`; if any of its `resourceRequests` `needsParams()`, push `{ name, reason: 'needs_params' }` instead (skip the whole resource — don't partially enqueue); otherwise enqueue a `ResourceRequestJob` for each of its `resourceRequests` (same call shape as `enqueueFirstJobs()`) and push `name` to `enqueued`.

This needs an existence check on `ResourceRegistry` — add `has(name)` to `NamedRegistry` (`source/lib/registry/NamedRegistry.js`, returns `name in this.items`) plus the matching static delegate on `ResourceRegistry` (`source/lib/registry/ResourceRegistry.js`), following the same static-facade pattern as `getItem`/`filter`/`size`.

### Step 4 — Wire `names` through `start()` and add `pushResources()`

- Change `ApplicationInstance#start(names = [])` to call `this.enqueueResources(names)` instead of `enqueueFirstJobs()`, and return its result.
- Add `ApplicationInstance#pushResources(names = [])` — no status check, just `return this.enqueueResources(names)` — for enqueueing into an already-`running` engine.
- Update the `Application` static facade (`source/lib/services/Application.js`): forward `names` through `start(names)`, and add `enqueueResources(names)` / `pushResources(names)` static delegates.

### Step 5 — Parse the request body

In `Router.js` (`source/lib/server/Router.js`), add `router.use(express.json())` before route registration so `req.body` is populated for `PATCH /engine/start` (no other route currently needs a body).

### Step 6 — Update `EngineStartHandler`

Keep the `request` object (constructor currently discards it as `_request`) and rewrite `handle()`:
- Read `resources` from `request.body?.resources` (default to `[]` unless it's an array).
- If `Application.isStopped()` → `await Application.start(resources)`, respond `{ status: 'running', ...result }`.
- Else if `Application.isRunning()` → `Application.pushResources(resources)`, respond `{ status: 'running', ...result }`.
- Else (paused/pausing/stopping) → throw `ConflictError()`, unchanged from today.

### Step 7 — Update documentation

- `docs/agents/web-server.md`: document `web.autostart` under Configuration; update the `/engine/start` row and add the request/response JSON shapes (mirroring the issue's examples) plus a short note on the `stopped` vs `running` behavior and `skippedResources` reasons (`not_found`, `needs_params`).
- `docs/agents/flow.md`: add `autostart: false` (optional, default `true`) to the `web:` block in the sample YAML.

## Files to Change

- `source/lib/models/configs/WebConfig.js` — add `autostart` (default `true`).
- `source/lib/services/ApplicationInstance.js` — skip auto-start in `run()` when disabled; add `enqueueResources()`/`pushResources()`; update `start()`.
- `source/lib/services/Application.js` — facade delegates for `enqueueResources`, `pushResources`, updated `start(names)`.
- `source/lib/registry/NamedRegistry.js` — add `has(name)`.
- `source/lib/registry/ResourceRegistry.js` — add static `has(name)` delegate.
- `source/lib/server/Router.js` — add `express.json()` middleware.
- `source/lib/server/handlers/engine/EngineStartHandler.js` — read body, branch on stopped/running/other, new response shape.
- `docs/agents/web-server.md`, `docs/agents/flow.md` — documentation updates.
- Specs mirroring every source file above (`source/spec/lib/...`), plus updates to `source/spec/lib/server/handlers/engine/EngineStartHandler_spec.js` and `source/spec/lib/services/ApplicationInstance_spec.js` for the new branches.

## CI Checks

- `source/`: `cd source && yarn coverage && yarn lint && yarn report` (CI jobs: `jasmine`, `checks`)

## Notes

- When the request body is empty/omitted, the response intentionally omits `enqueued`/`skippedResources` info beyond empty arrays — the bulk `enqueueFirstJobs()` path enqueues by `ResourceRequest`, not by resource name, so there's nothing more specific to report for that path without a larger refactor. This matches the issue's decision that empty body falls back to today's default behavior.
- A named resource is skipped in full (`needs_params`) if *any* of its `resourceRequests` needs parameters — no partial enqueue of a resource's individual requests. Flagged here in case review wants finer granularity.
- `paused`/`pausing`/`stopping` states keep today's `ConflictError` on `/engine/start` — the issue only calls out `stopped` and `running` explicitly.

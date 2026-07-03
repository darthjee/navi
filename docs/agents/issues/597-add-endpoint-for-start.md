# Issue: Add endpoint for start

## Description
Right now, when the web server is enabled (`web.port` configured), the engine starts processing immediately at boot: `Application.run()` unconditionally enqueues all parameter-free resources and starts the allocation loop, with no way to defer this.

We need a way to boot with the web server up but the engine left idle, so an operator can choose which resources to warm before processing begins — and be able to push more resources into the queue later, whether or not the engine is already running.

## Problem
There is no configuration option to prevent the engine from auto-starting when in web server mode, and the existing `PATCH /engine/start` endpoint (`source/lib/server/handlers/engine/EngineStartHandler.js`) only resumes a *stopped* engine — it takes no request body, always re-enqueues every parameter-free resource, and returns 409 if the engine is not stopped. It cannot be used to (a) start with a specific subset of resources, or (b) push additional resources into an already-running engine.

## Expected Behavior
- A new `web.autostart` configuration option (boolean, default `true`) controls whether the engine auto-starts when web mode is enabled.
- When `web.autostart: false`, the application boots with the web server running but the engine left in a `stopped` state (no jobs enqueued, no allocation loop running) until `PATCH /engine/start` is called.
- `PATCH /engine/start` accepts a JSON body naming which resources should be pushed into the queue:

  ```json
  {
    "resources": ["home_page", "categories"]
  }
  ```

  Names refer to entries in the config's top-level `resources:` map (same names used in YAML), and must be parameter-free (no `{:placeholder}` tokens) to be enqueued.
- If the body is empty/omitted, behavior falls back to today's default: enqueue all parameter-free resources.
- If the engine is `stopped`, the named (or default) resources are enqueued and the engine transitions to `running`.
- If the engine is already `running`, the named resources are pushed into the existing queue instead of returning a conflict — no more `409` when resources are supplied.
- Unknown resource names, or names that require parameters, are skipped (not enqueued) rather than failing the whole request; the response reports which were skipped.

  ```json
  {
    "status": "running",
    "enqueued": ["home_page"],
    "skippedResources": [
      { "name": "products", "reason": "needs_params" },
      { "name": "unknown_resource", "reason": "not_found" }
    ]
  }
  ```

## Solution
- Add `autostart` (default `true`) to `WebConfig` (`source/lib/models/configs/WebConfig.js`).
- In `ApplicationInstance.run()` (`source/lib/services/ApplicationInstance.js`), skip `enqueueFirstJobs()` and boot with status `stopped` when `web.autostart` is `false` (only meaningful when `webConfig` is present).
- Update `EngineStartHandler` to read `resources` from the request body, resolve each name via `ResourceRegistry`, filter out unknown/parameterized entries into `skippedResources`, enqueue the rest, and no longer throw `ConflictError` when the engine is already running.
- Document the finalized request/response contract for `PATCH /engine/start` in this issue and in the PR description.

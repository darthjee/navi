# Delete EngineEvents and its dead references

Once steps 01–03 land, nothing should import `EngineEvents` anymore. Delete it and its spec, and strip the now-dead `EngineEvents.reset()` teardown call (plus its import) from every spec file that only used it for that — a boilerplate pattern copied across many spec files, distinct from the real behavioral rewrites in step 05.

- Delete `source/lib/services/engine/EngineEvents.js`.
- Delete `source/spec/lib/services/engine/EngineEvents_spec.js`.
- Remove the `EngineEvents` import and the `EngineEvents.reset()` call (teardown-only, no other use) from:
  - `source/spec/support/utils/RegistryCleanupUtils.js`
  - `source/spec/lib/server/Router_spec.js`
  - `source/spec/lib/server/RouteRegister_spec.js`
  - `source/spec/lib/server/RouteRegister_post_spec.js`
  - `source/spec/lib/server/RouteRegister_patch_spec.js`
  - `source/spec/lib/server/WebServer_spec.js`
  - `source/spec/lib/server/handlers/LogsHandler_spec.js`
  - `source/spec/lib/server/handlers/jobs/JobLogsHandler_spec.js`
- Leave `source/spec/lib/registry/LogRegistryInstance_spec.js`, `source/spec/lib/registry/LogRegistry_spec.js`, `source/spec/lib/services/application/ApplicationInstance_spec.js`, `source/spec/lib/services/engine/EngineController_spec.js`, and `source/spec/lib/utils/logging/LogBufferCollection_spec.js` for step 05 — they need real behavioral rewrites, not just import/teardown removal (though the same dead `EngineEvents.reset()` teardown should go there too, as part of that rewrite).

## Files to Change

- `source/lib/services/engine/EngineEvents.js` — delete.
- `source/spec/lib/services/engine/EngineEvents_spec.js` — delete.
- `source/spec/support/utils/RegistryCleanupUtils.js` — remove the `EngineEvents` import and `.reset()` call.
- `source/spec/lib/server/Router_spec.js` — remove the `EngineEvents` import and `.reset()` call.
- `source/spec/lib/server/RouteRegister_spec.js` — remove the `EngineEvents` import and `.reset()` call.
- `source/spec/lib/server/RouteRegister_post_spec.js` — remove the `EngineEvents` import and `.reset()` call.
- `source/spec/lib/server/RouteRegister_patch_spec.js` — remove the `EngineEvents` import and `.reset()` call.
- `source/spec/lib/server/WebServer_spec.js` — remove the `EngineEvents` import and `.reset()` call.
- `source/spec/lib/server/handlers/LogsHandler_spec.js` — remove the `EngineEvents` import and `.reset()` call.
- `source/spec/lib/server/handlers/jobs/JobLogsHandler_spec.js` — remove the `EngineEvents` import and `.reset()` call.

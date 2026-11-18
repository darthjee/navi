# Integration specs for shutdown run summary and threshold

Add `source/spec/lib/services/application/Application_shutdown_threshold_spec.js`, modelled on `Application_threshold_spec.js` (Dummy job/worker factories, `FixturesUtils`, `RegistryCleanupUtils.resetApplicationState()`) and on `Application_webServer_spec.js` (web mode + `Application.shutdown()`). Use a web-mode fixture (`web` section present, so `keepAlive` is on) with `failure.threshold`; add a new fixture under `source/spec/support/fixtures/config/` if none combines web + failure. Spy on `LogRegistry.info` to capture the summary and stub `process.exit`.

Scenarios:

- Jobs processed with dead ratio above threshold (`DummyJob.setSuccessRate(0)`), wait until the queue drains, then `await Application.shutdown()` and the run promise: summary contains a non-zero `Total:` matching the processed jobs and `Result: Failure`; `process.exit` called with `1`.
- Same with ratio within threshold (`successRate: 1`): summary shows real counts, `Result: Success`; `process.exit` not called.
- Idle-timeout variant: fixture with `web.idle_timeout` set (small value; fake timers or a short real timeout, whichever the existing idle-timeout specs use) — auto-shutdown yields the same outcome as the first scenario.
- Shutdown with zero jobs processed (autostart off or no resources enqueued): summary `Total: 0`, `process.exit` not called.

## Files to Change

- `source/spec/lib/services/application/Application_shutdown_threshold_spec.js` — new integration spec.
- `source/spec/support/fixtures/config/*.yml` — new web-mode + failure-threshold fixture(s) if needed.

# Align EngineController's start contract with ServerController

`EngineController#launch(shouldAutostart)` and `ServerController#start()` currently differ in both name and signature (`launch` requires an arg, `start` takes none). Move the `shouldAutostart` decision to build-time so both controllers expose a uniform, argument-free `start()` that returns a promise.

- Add a `shouldAutostart` parameter to `EngineController`'s constructor and store it as a private field.
- Add `shouldAutostart` to `EngineController.build({ ... })`'s params and pass it through to the constructor.
- Rename `launch(shouldAutostart)` to `start()`, reading the stored field instead of taking a parameter. The body logic (branch on the flag, set state, call `this.engine.start()`) stays the same — only the source of the flag changes.
- `ApplicationInstance.run()` still computes the flag itself via its existing `#shouldAutostart()` and now passes it into `EngineController.build({ ..., shouldAutostart: this.#shouldAutostart() })` instead of into the start call — this intermediate wiring is superseded by step 03, so it's fine to leave `run()` calling `this.#engineController.start()` directly at the end of this step (still correct, just not yet routed through `StartupCoordinator`).

## Files to Change

- `source/lib/services/engine/EngineController.js` — add `shouldAutostart` to the constructor and `build()`, rename `launch` to `start()` reading the stored field.
- `source/lib/services/application/ApplicationInstance.js` — pass `shouldAutostart: this.#shouldAutostart()` into `EngineController.build({...})`; call `this.#engineController.start()` (no arg) instead of `launch(this.#shouldAutostart())`.
- `source/spec/lib/services/engine/EngineController_spec.js` — update the `#launch` describe block (currently calls `localController.launch(true)` / `localController.launch(false)`) to a `#start` describe block that builds/constructs the controller with `shouldAutostart: true`/`false` and calls `start()` with no args.
- `source/spec/lib/services/application/ApplicationInstance_spec.js` — update any expectations that assert `EngineController.build` params or the `launch`/`start` call shape.

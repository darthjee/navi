# Split the spec into three files
Replace the single spec with three files. Each one calls `EngineControllerSpecUtils.setupController()` inside `describe('EngineController', ...)`, uses `FakeEngine`/`EngineControllerExamples` where needed, and reads `ctx.controller`, `ctx.state`, `ctx.enqueueResources` and `ctx.reloadConfig` in place of the old closure variables. Move the `describe` blocks unchanged apart from those references.

- `EngineController_spec.js` (about 230 lines): `#buildEngine`, `#bind`, `.build`. These use `ctx.state` and `ctx.enqueueResources` and build their own local controllers, as they do today.
- `EngineController_lifecycle_spec.js` (about 140 lines): `#start`, `#pause`, `#stop`, `#shutdown`, `#finishRun`. In `#finishRun`, the `beforeEach` assigns the new controller to `ctx.controller`.
- `EngineController_resume_spec.js` (about 160 lines): `#continue`, `#resumeProcessing`, `#restart`, `#reload`. These use the shared examples.

Afterwards, run `wc -l` on every new or changed file to confirm each is under 300 lines. Run `yarn spec` and `yarn lint` in `source/`. The total number of specs reported by Jasmine must match the count before the split.

## Files to Change
- `source/spec/lib/services/engine/EngineController_spec.js` — reduced to the wiring specs (`#buildEngine`, `#bind`, `.build`).
- `source/spec/lib/services/engine/EngineController_lifecycle_spec.js` — new; `#start`, `#pause`, `#stop`, `#shutdown`, `#finishRun`.
- `source/spec/lib/services/engine/EngineController_resume_spec.js` — new; `#continue`, `#resumeProcessing`, `#restart`, `#reload`.

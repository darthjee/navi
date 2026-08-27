# Extract EngineState

Create `EngineState`, a small value object encapsulating the engine status state machine and its predicates, so `ApplicationInstance` no longer owns `#engineStatus` directly.

- New file `source/lib/services/EngineState.js`. Holds an internal status field (values: `running`, `pausing`, `paused`, `stopping`, `stopped`, or `undefined` before anything has run).
- Public methods: `get()` (returns the current string, `undefined` initially), `set(value)` (sets the string as-is, no validation beyond accepting the string), `isRunning()`, `isPaused()`, `isStopped()` — predicates compare the internal value to the matching literal, all `false` while undefined.
- This class stays purely internal plumbing: `ApplicationInstance.status()` / `setStatus(value)` keep their existing plain string-in/string-out signature (spec-locked — see `ApplicationInstance_spec.js` lines 22, 43, 56, 76, 195, 213, 225) — they just delegate to `this.#state.get()` / `this.#state.set(value)` internally (wired in step 05). `isRunning`/`isPaused`/`isStopped` on `ApplicationInstance` delegate the same way.
- Do not wire this into `ApplicationInstance` yet — that happens in step 05.

## Files to Change
- `source/lib/services/EngineState.js` (new)
- `source/spec/lib/services/EngineState_spec.js` (new) — cover `get`/`set`, each predicate true/false, and the undefined-initial-state case.

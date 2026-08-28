# Worker Plan: Migrate EngineEvents subscribers to Engine listener API and remove EngineEvents

Main plan: [plan.md](plan.md)

## Shared contracts

Add two new public instance methods to `Engine` (`worker/lib/services/Engine.js`): `on(eventName, handler)` and `emit(eventName, ...args)`, composing a private `EventEmitter`. Treat event names as opaque strings — no enum, no Navi-specific names baked in. Required behavior `engine` (the other involved agent) relies on:
- Multiple `on()` calls registered for the same event name fire in registration order.
- `emit()` on an event with zero listeners is a safe no-op (these are ordinary custom event names, not Node's reserved `'error'` event, so no throw).
- If a listener throws, later listeners registered for that same event do not run for that `emit()` call — this is `EventEmitter`'s native behavior, not something to special-case.

## Implementation Steps

### Step 1 — Add the generic listener API to Engine

Add a private `#emitter = new EventEmitter()` field to `Engine`, plus two public methods delegating to it:
- `on(eventName, handler)` → `this.#emitter.on(eventName, handler)`
- `emit(eventName, ...args)` → `this.#emitter.emit(eventName, ...args)`

Import `EventEmitter` from Node's built-in `events` module. Follow the file's existing JSDoc conventions (see the doc comments on `stop()`/`pause()`/`resume()` for the expected shape) — document both methods as generic/domain-agnostic, not tied to any specific event name.

### Step 2 — Add spec coverage for `on`/`emit`

In `worker/spec/lib/services/Engine_spec.js`, add coverage for the new methods:
- Registering a handler with `on()` and calling `emit()` invokes it, forwarding any extra arguments.
- Two handlers registered for the same event name both fire, in registration order.
- Calling `emit()` for an event with no registered listeners does not throw.

## Files to Change

- `worker/lib/services/Engine.js` — add the `#emitter` field and the `on()`/`emit()` methods.
- `worker/spec/lib/services/Engine_spec.js` — new spec coverage for `on()`/`emit()`.

## CI Checks

- `worker`: `npm run coverage` (CI job: `jasmine-worker`)
- `worker`: `npm run lint` (CI job: `checks-worker`)

## Notes

- This step has no dependency on `engine`'s work and can be implemented and merged independently, but `engine`'s changes (see [engine.md](engine.md)) depend on this API existing first.

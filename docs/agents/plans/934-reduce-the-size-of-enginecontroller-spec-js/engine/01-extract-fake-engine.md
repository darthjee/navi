# Extract FakeEngine dummy
Move `buildFakeEngine` out of the spec into a reusable dummy, next to `DummyWorkersAllocator`. Keep its behavior exactly: default no-op `start` (async), `pause`, `resume`, `stop`, and an `on`/`emit` pair backed by a handlers map, with any `overrides` taking precedence (for example, `start: jasmine.createSpy('start')...` in the `#start` specs).

Expose it in the style of the other support files, for example a `FakeEngine` class with a static `build(overrides = {})` that returns the object, and keep a JSDoc explaining its purpose. Every former `buildFakeEngine(...)` call becomes `FakeEngine.build(...)`.

## Files to Change
- `source/spec/support/dummies/services/FakeEngine.js` — new; the fake engine test double moved from the spec.

# Refactor MemoryStatusHelper_spec
Reduce duplication in `MemoryStatusHelper_spec.js` while keeping every scenario and assertion.

- Replace the hand-rolled `container`/`root` `beforeEach`/`afterEach` with `const state = useContainer();` (from `../support/dom.js`) and read `state.container` / `state.root` in the specs.
- Replace each `await act(async () => { root.render(...) })` `beforeEach` body with `renderInAct(state.root, <element>)` (from `../support/dom.js`); drop the now-unused `act` and `createRoot` imports.
- In `.render`, the three scenarios (within bounds, floating point precision, percentage above 100) only differ by input data and expected output. Table-drive the "render with `data`" `beforeEach`, or at minimum share it, while keeping all existing `it`s: within bounds (status label, formatted current/maximum, formatted percentage `85.0%`, `.text-memory-high`), floating point (`16.3%`), over 100 (`.text-memory-over-limit` present, `.text-memory-over` absent). Leave `.renderLoading` and `.renderError` scenarios as they are apart from the shared setup.

## Files to Change
- `frontend/spec/components/MemoryStatusHelper_spec.js` — use `useContainer` and `renderInAct`, share the `.render` setup

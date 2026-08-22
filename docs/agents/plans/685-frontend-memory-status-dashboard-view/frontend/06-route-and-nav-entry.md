# Route and nav entry point

Wire the new page into the app: register the route, and add a discoverable link to it (agreed during refinement — nothing currently links to `/memory/status`, so it must not be URL-only).

## Route

Register alongside the existing routes in `frontend/src/main.jsx`, inside the same `Layout`:

```jsx
import MemoryStatus from './components/pages/MemoryStatus.jsx';
// ...
<Route path="memory/status" element={<MemoryStatus />} />
```

## Nav entry point

Add a `StatItem` tile in `frontend/src/components/elements/StatsDisplay.jsx`, following the existing "Logs" tile pattern exactly (`<StatItem label="Logs" variant="info" to="/logs" />`):

```jsx
<StatItem label="Memory" variant="info" to="/memory/status" />
```

Note `StatItem` always renders a `value` (see `StatItem.jsx`); the existing "Logs" tile is the only current example of a value-less nav tile (it omits the `value` prop, so `undefined` renders as nothing but the label still shows) — reuse that same value-less pattern rather than trying to source a numeric value from `/memory/status.json` for the tile itself (the actual current/maximum/status figures belong on the page, not the tile).

## Files to Change

- `frontend/src/main.jsx` — import `MemoryStatus` and add the `memory/status` route.
- `frontend/src/components/elements/StatsDisplay.jsx` — add the "Memory" nav tile.
- No dedicated `StatsDisplay_spec.js` exists today — `StatsDisplay` is currently only exercised indirectly via `frontend/spec/components/StatsHeader_spec.js`'s success-state assertions. Extend that spec to also assert the new "Memory" tile renders and links to `/memory/status`, rather than introducing a new spec file for `StatsDisplay` in isolation.

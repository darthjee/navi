# Render in `Layout`, remove Logs/Memory from `StatsDisplay`

Wire the new dropdown into the header and remove the now-redundant hard-coded
cards. This is the deliberate, accepted visible change: Logs and Memory move from
inline stat cards to entries in a header dropdown.

## `Layout.jsx`

- Import `MenuMenu` from `../elements/MenuMenu.jsx`.
- Render `<MenuMenu />` in the header `div` next to `<LinksMenu />` (order:
  `<MenuMenu />` then `<LinksMenu />`, or vice versa — keep both in the same
  `d-flex … gap-3` row).

## `StatsDisplay.jsx`

- Remove the trailing block:
  ```jsx
  <div className="vr mx-1" />
  <StatItem label="Logs" variant="info" to="/logs" />
  <StatItem label="Memory" variant="info" to="/memory/status" />
  ```
- If `StatItem` / no other symbol becomes unused, tidy imports (it is still used
  for the Emissions group, so the import stays).
- The `<Route>` elements in `frontend/src/main.jsx` are **unchanged** — the pages
  still exist and are still reachable.

## Files to Change

- `frontend/src/components/pages/Layout.jsx` — import + render `<MenuMenu />`.
- `frontend/src/components/elements/StatsDisplay.jsx` — remove the Logs/Memory
  `<StatItem>` cards and the preceding `<div className="vr mx-1" />`.
- `frontend/spec/components/StatsDisplay_spec.js` — add an assertion that
  `Logs` / `Memory` are no longer rendered (the current spec only covers the
  Emissions group, so nothing breaks; add a small `describe` guarding the
  removal).
- If a `Layout` spec exists, add a check that the menu dropdown mounts; mock
  `/menu.json` alongside `/links.json`.

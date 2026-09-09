# Client-side menu merge

The internal-navigation dropdown (`MenuMenu` → `MenuClient.fetchEntries()` →
`GET /menu.json`) must also list extension routes, appended after the menu-file
entries, deduped by route, minus any route the operator hid (shared contract #4).

## Changes

### `src/clients/MenuClient.js`

- `fetchEntries()` currently returns `data.entries ?? []`. Change it to return the
  full `{ entries, hidden }` (default `{ entries: [], hidden: [] }`), or add a
  sibling method — whichever keeps existing callers working. `hidden` must reach
  the merge logic.

### `src/components/elements/controllers/MenuMenuController.js(x)`

- `buildEffect(setEntries)` currently just `MenuClient.fetchEntries().then(setEntries)`.
  Change it to also `loadExtensions()` (from step 02 — cached, so no double
  fetch/import) and merge:

  ```js
  const [{ entries, hidden }, extensions] = await Promise.all([
    MenuClient.fetchEntries(),
    loadExtensions(),
  ]);
  const present = new Set(entries.map((e) => e.route));
  const hiddenSet = new Set(hidden);
  const extraEntries = extensions
    .map((d) => ({ route: d.path, text: d.text }))
    .filter((e) => !present.has(e.route) && !hiddenSet.has(e.route));
  setEntries([...entries, ...extraEntries]);
  ```

  Keep `.catch(noop)` semantics — a failure in either source must not break the
  menu.

### `MenuMenuHelper` / `MenuDropdown` / `MenuDropdownItem`

- No change expected — they already render a flat `{ route, text }[]`. Verify
  `MenuDropdownItem` handles an internal SPA `route` like `/ext/reports` the same
  way it handles `/logs` (hash navigation).

## Files to Change

- `frontend/src/clients/MenuClient.js` — surface `hidden` alongside `entries`.
- `frontend/src/components/elements/controllers/MenuMenuController.jsx` — merge
  extension descriptors into the menu entries, honouring `hidden` + dedupe.

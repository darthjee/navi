# Update `docs/agents/web-server.md`

Document the two new frontend-extension routes and the `/menu.json` shape change,
matching the style of the existing `## Route extensions` section (added by
IMPL-3).

## Changes

- **Source layout** block: add `FrontendManifestHandler.js` and
  `FrontendAssetsHandler.js` under `handlers/`.
- **`## Routes`** table: add rows for
  `GET /extensions/frontend.json` ("Discovery manifest for mounted frontend
  extension bundles; `{ bundles: [] }` when extensions are disabled") and
  `GET /extensions/frontend/*path` ("Serves a mounted frontend bundle / CSS file;
  403 on traversal, 404 when disabled or missing").
- **`### GET /menu.json`** subsection: document the new always-present `hidden`
  array — non-default menu-file routes flagged `hidden: true`, used by the SPA to
  drop matching extension routes from the auto-appended menu entries. Show the
  updated response example `{ "entries": [...], "hidden": [...] }`.
- Add a short **`### Frontend extensions`** subsection under `## Route extensions`
  (or a sibling section) describing: runtime registration of pre-built ESM
  bundles under `NAVI_EXTENSIONS_DIR/frontend/`, the flat `*.js` (+ optional
  sibling `*.css`) layout, the manifest → asset flow, the server-side enable
  gate, and that the SPA — not the server — reads the bundles. Cross-reference
  `docs/agents/frontend.md` for the SPA-side wiring and
  `docs/agents/future/extension-architecture.md` `## Frontend` for the full spec.

## Files to Change

- `docs/agents/web-server.md` — layout entry, two route-table rows, `/menu.json`
  `hidden` documentation, a `Frontend extensions` subsection.

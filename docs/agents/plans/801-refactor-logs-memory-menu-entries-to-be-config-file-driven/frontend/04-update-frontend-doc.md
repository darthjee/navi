# Update `docs/agents/frontend.md`

Reflect the new client, components, and the relocation of Logs/Memory.

## Changes

- **`## Source layout` (~line 18–40):** add `clients/MenuClient.js`; add the new
  `elements/` components (`MenuMenu.jsx`, `MenuDropdown.jsx`,
  `MenuDropdownItem.jsx`, `controllers/MenuMenuController.jsx`,
  `helpers/MenuMenuHelper.jsx`, `helpers/MenuDropdownHelper.jsx`) to the tree.
- **`## Routing` / `## Component hierarchy` (~line 80–113):** show `Layout`
  rendering `MenuMenu` alongside `LinksMenu`; note that the internal menu
  (Logs, Memory, and any operator entries) is now data-driven from
  `GET /menu.json` rather than hard-coded in `StatsDisplay`.
- Mention that `MenuDropdownItem` uses `react-router-dom` `<Link>` for internal
  routes and a new-tab `<a>` for external URLs.
- If there is an API-clients subsection, add `MenuClient` next to `LinksClient`
  with a one-line description.

## Files to Change

- `docs/agents/frontend.md` — source layout, component hierarchy / routing
  notes, clients list.

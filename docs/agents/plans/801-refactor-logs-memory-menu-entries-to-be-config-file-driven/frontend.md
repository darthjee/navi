# Frontend Plan: Refactor Logs/Memory menu entries to be config-file driven

Main plan: [plan.md](plan.md)

## Shared contracts

Consumes `GET /menu.json` (contract 1):

```json
{ "entries": [ { "route": "/logs", "text": "Logs" }, { "route": "/memory/status", "text": "Memory" } ] }
```

- `entries` is always present; may be `[]` (render no dropdown, like `LinksMenu`
  with zero links).
- Each entry has `route` (string, `/…` internal or `https?://…` external) and
  `text` (non-empty string, always present).
- No `hidden` key in the payload; no client-side validation, dedup, ordering, or
  merge logic (all IMPL-2). Render entries in the order received.

`source/static/` is git-ignored and rebuilt by CI — **do not commit build
output**. Build locally only to confirm the SPA compiles.

## Steps

- [01 — Add `MenuClient`](frontend/01-add-menu-client.md)
- [02 — Add the `MenuMenu*` component family](frontend/02-add-menu-component-family.md)
- [03 — Render in `Layout`, remove Logs/Memory from `StatsDisplay`](frontend/03-render-in-layout-remove-statitems.md)
- [04 — Update `docs/agents/frontend.md`](frontend/04-update-frontend-doc.md)

## CI Checks

- `frontend`: `cd frontend && npm run lint` (CI job: `checks-frontend`)
- `frontend`: `cd frontend && npm test` (CI job: `jasmine-frontend`)
- Build sanity (not a CI PR gate): `cd frontend && yarn build` must succeed.

## Notes

- Clone the `LinksMenu*` family rather than parameterising it — the two must stay
  independent (per the issue's answered clarifying question). `LinksMenu` /
  `LinksDropdown` / `LinksDropdownItem` / `LinksMenuController` /
  `LinksMenuHelper` / `LinksDropdownHelper` stay untouched.
- The one real behavioural difference from the links family:
  `MenuDropdownItem` must render **internal** routes (`/…`) as a
  `react-router-dom` `<Link to={route}>` (SPA navigation, closes the dropdown on
  click), and **external** routes (`https?://…`) as
  `<a href target="_blank" rel="noreferrer">` like `LinksDropdownItem`.
- `<MenuMenu />` renders inside `Layout`, which is a routed component under
  `HashRouter`, so `<Link>` works without extra wiring.
- Dropdown toggle button label: use `Menu` (the links one uses `Links`).

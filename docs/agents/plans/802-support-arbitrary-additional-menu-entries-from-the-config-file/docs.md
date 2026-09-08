# docs Plan: Support arbitrary additional menu entries from the config file

Main plan: [plan.md](plan.md)

## Shared contracts

Document the **menu configuration file schema** exactly as settled in SPEC-2
(#796) and summarised in [plan.md](plan.md) "Menu configuration file schema":
file location and mount (`-m` / `--menu`, `NAVI_MENU`, default
`config/menu.yml`), the `{ route, text[, hidden] }` entry shape, merge with the
Logs/Memory defaults, `defaults: false` full-replace (only way to empty the
menu), per-entry `hidden: true` on a default, repositioning a default by
re-listing its `route` (text override vs. bare re-list keeping the label),
first-wins de-duplication by `route`, `${VAR}` interpolation, and the scrolling
panel for long menus. Match the behaviour the `engine` agent implements in
`MenuConfig`.

This is a **user-facing guide** (`docs/guides/navi/`), written for a Navi
operator — not the agent-facing `docs/agents/*` references (those are updated by
`engine` / `frontend`).

## Implementation Steps

### Step 1 — New guide `docs/guides/navi/configuring-the-menu.md`

Write a new operator guide. Follow the tone, structure, and depth of the sibling
guides (e.g. `extending-navi.md`, `splitting-configuration.md`): short intro,
worked YAML examples, one section per lever. Cover:

- What the internal menu is and where the file lives (default `config/menu.yml`,
  `-m` / `--menu`, `NAVI_MENU`, Docker volume mount example).
- Entry shape: `route` (internal `/…` path or `http(s)://` URL), optional `text`
  (defaults to `route`), optional `hidden`.
- Adding entries — merge with the Logs/Memory defaults; defaults first, custom
  entries after in file order (worked example).
- `defaults: false` — drop both defaults; the only way to an empty menu.
- Hiding one default — `hidden: true` against `/logs` or `/memory/status`;
  `hidden` on a non-default route is ignored with a warning.
- Repositioning / relabelling a default by re-listing its `route` (with and
  without `text`).
- Duplicate `route` — first wins, later ones ignored with a log warning.
- `${VAR}` interpolation.
- Long menus scroll; grouping / icons / submenus / an `order` key are not
  supported.
- Note: a menu entry can point at a route added via the extensions mechanism
  (`extending-navi.md`) — register the route first, then add the entry.

### Step 2 — Link it from the index

Add a bullet to the guide list in `docs/guides/how_to_use_navi.md`, next to the
"Extending Navi with Your Own Routes and Pages" entry, e.g.:

`- [Configuring the internal navigation menu](./navi/configuring-the-menu.md) — Adding, hiding, reordering, and relabelling entries in the internal menu via config/menu.yml.`

## Files to Change

- `docs/guides/navi/configuring-the-menu.md` — new operator guide.
- `docs/guides/how_to_use_navi.md` — index bullet linking the new guide.

## Notes

- Do not document or reference `docs/agents/future/menu-configuration.md`; it is
  internal design material removed later by CLEAN-1 (#807).

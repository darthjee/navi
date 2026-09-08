# Update docs/agents/frontend.md

The menu paragraph under "Component hierarchy" already says the internal menu is
"Logs, Memory, and any operator-configured entries" and data-driven from
`GET /menu.json`. Add one sentence noting that:

- the entry list is fully resolved server-side (merge with defaults,
  `defaults: false`, `hidden`, repositioning, de-duplication) — the frontend
  renders `entries` verbatim; and
- the dropdown panel scrolls (`menu-dropdown-panel`, `max-height` +
  `overflow-y: auto`) so a long operator menu does not overflow the viewport;
  `LinksDropdown` is unchanged.

Keep it brief — this doc is a hierarchy/overview reference, not a config guide
(that is the new `docs/guides/navi/configuring-the-menu.md`).

## Files to Change

- `docs/agents/frontend.md` — one or two sentences on server-side resolution and
  the scrolling panel.

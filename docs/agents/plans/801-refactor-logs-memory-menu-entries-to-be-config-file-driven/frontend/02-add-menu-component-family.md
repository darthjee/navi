# Add the `MenuMenu*` component family

Clone the `LinksMenu*` family into an independent `MenuMenu*` family under
`frontend/src/components/elements/`. Structure mirrors the source 1:1; only
`MenuDropdownItem` diverges (internal vs external routes).

## Files to create

- `frontend/src/components/elements/MenuMenu.jsx` — clone of `LinksMenu.jsx`:
  `useState([])` for entries, dropdown open state, outside-click effect,
  `useMemo(() => new MenuMenuHelper(entries), [entries])`, returns `null` when
  no entries, else `menu.renderDropdown(...)`.
- `frontend/src/components/elements/controllers/MenuMenuController.jsx` — clone
  of `LinksMenuController.jsx`; `buildEffect(setEntries)` calls
  `MenuClient.fetchEntries().then(setEntries).catch(noop)`. Outside-click
  handlers identical.
- `frontend/src/components/elements/helpers/MenuMenuHelper.jsx` — clone of
  `LinksMenuHelper.jsx`; `hasAny()`, `renderDropdown()` → `<MenuDropdown … entries={…} />`.
- `frontend/src/components/elements/MenuDropdown.jsx` — clone of
  `LinksDropdown.jsx`; button label `Menu`; renders
  `MenuDropdownHelper.renderEntries(entries, { onNavigate: () => setOpen(false) })`
  when open.
- `frontend/src/components/elements/helpers/MenuDropdownHelper.jsx` — clone of
  `LinksDropdownHelper.jsx`; maps `entries` to `<MenuDropdownItem key={route}
  route={route} text={text} onNavigate={onNavigate} />` inside
  `<ul className="dropdown-menu show">`.
- `frontend/src/components/elements/MenuDropdownItem.jsx` — **the divergent
  one**:
  - internal route (`route.startsWith('/')`): render
    `<li><Link to={route} className="dropdown-item" onClick={onNavigate}>{text}</Link></li>`
    using `react-router-dom` `Link`.
  - external route (`/^https?:\/\//.test(route)`): render
    `<li><a href={route} target="_blank" rel="noreferrer" className="dropdown-item">{text}</a></li>`
    (same as `LinksDropdownItem`).

## Files to Change

- The six new component files above.
- `frontend/spec/components/MenuMenu_spec.js` — new; mirror `LinksMenu_spec.js`
  (no entries ⇒ renders nothing; entries ⇒ toggle button labelled `Menu`;
  entries hidden until opened; opening shows all; fetch failure ⇒ renders
  nothing). Mock `/menu.json` via the existing `support/fetch.js` helpers;
  render inside a router wrapper (see `StatsDisplay_spec.js`'s `MemoryRouter`
  usage) since `MenuDropdownItem` uses `<Link>`.
- `frontend/spec/components/MenuDropdown_spec.js` — new; mirror
  `LinksDropdown_spec.js`.
- `frontend/spec/components/MenuDropdownItem_spec.js` — new; mirror
  `LinksDropdownItem_spec.js` plus: internal `route` renders an `<a
  href="#/logs">`-style `Link` (no `target="_blank"`), external `route` renders
  `target="_blank"` + `rel="noreferrer"`. Wrap in `MemoryRouter` for the
  internal case.

# Scrolling dropdown panel

Make the internal menu dropdown panel scroll instead of growing unbounded when an
operator configures many entries.

- Add a dedicated class (e.g. `menu-dropdown-panel`) to the `<ul>` in
  `MenuDropdownHelper.renderEntries` — keep the existing
  `dropdown-menu show` classes.
- Create `frontend/src/components/elements/MenuDropdown.css` with:
  ```css
  .menu-dropdown-panel {
    max-height: calc(100vh - 4rem); /* ≈ viewport minus the navbar */
    overflow-y: auto;
  }
  ```
  Tune the `4rem` to the actual header height if it differs.
- `import './MenuDropdown.css';` from `MenuDropdown.jsx` (the component that owns
  the panel), matching the SPA's co-located-CSS convention.
- Do **not** touch `LinksDropdown` / `LinksDropdownHelper` or the global
  `.dropdown-menu`.
- No change to data flow, entry count, or ordering — the panel just scrolls.

## Files to Change

- `frontend/src/components/elements/helpers/MenuDropdownHelper.jsx` — add the
  `menu-dropdown-panel` class to the `<ul>`.
- `frontend/src/components/elements/MenuDropdown.css` — new; `max-height` +
  `overflow-y: auto`.
- `frontend/src/components/elements/MenuDropdown.jsx` — `import` the new CSS.

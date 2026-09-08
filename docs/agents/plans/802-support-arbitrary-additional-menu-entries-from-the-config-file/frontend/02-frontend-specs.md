# Frontend specs

Extend the existing Jasmine component specs.

- **`frontend/spec/components/MenuDropdown_spec.js`**
  - In the "when open" context, add a case rendering a long list (e.g. 20+
    entries) and assert every entry renders (`querySelectorAll('a').length`
    matches) — i.e. no client-side cap.
  - Assert the panel `<ul>` carries the `menu-dropdown-panel` class (the scroll
    hook). Asserting the class is enough — jsdom does not lay out `max-height`.
- **`frontend/spec/components/MenuMenu_spec.js`**
  - Optional: extend "when fetch returns entries" with a multi-entry payload to
    confirm `MenuMenu` → `MenuMenuHelper` → `MenuDropdown` passes them all
    through unchanged.
- No new spec needed for `MenuClient` — the response contract is unchanged.

## Files to Change

- `frontend/spec/components/MenuDropdown_spec.js` — many-entries render case +
  `menu-dropdown-panel` class assertion.
- `frontend/spec/components/MenuMenu_spec.js` — optional multi-entry pass-through
  case.

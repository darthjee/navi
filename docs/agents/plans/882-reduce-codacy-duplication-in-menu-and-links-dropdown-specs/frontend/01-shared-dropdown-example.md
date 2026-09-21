# Shared dropdown example
Create `frontend/spec/support/dropdown.js` exporting `itBehavesLikeDropdown({ state, label, items, render })`, following the style of `support/fetch_states.js`. `render(open)` renders the component under test into `state.root` with the given `open` flag and returns the `setOpen` spy (the same contract as the local `render` helpers in both specs today). It registers the scenarios common to `MenuDropdown` and `LinksDropdown`:

- when closed: renders the toggle button, shows `label` on it, shows no anchors, sets `aria-expanded` to `false`
- when open: shows one anchor per item, shows every item's text, sets `aria-expanded` to `true`
- when the toggle button is clicked: calls `setOpen`

Then rewrite `MenuDropdown_spec.js` and `LinksDropdown_spec.js` to call it, keeping only their own `render` helper (the `MemoryRouter` wrapper and the `entries`/`links` prop name stay in the spec). Menu-only scenarios stay in `MenuDropdown_spec.js`: the `menu-dropdown-panel` class assertion when open, and the 25-entry "when open with many entries" block.

## Files to Change
- `frontend/spec/support/dropdown.js` — new; `itBehavesLikeDropdown`
- `frontend/spec/components/MenuDropdown_spec.js` — use the shared example; keep the Menu-only scenarios
- `frontend/spec/components/LinksDropdown_spec.js` — use the shared example

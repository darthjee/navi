# frontend Plan: Support arbitrary additional menu entries from the config file

Main plan: [plan.md](plan.md)

## Shared contracts

- **`GET /menu.json` is unchanged.** `entries` arrives already fully resolved by
  the backend (defaults merged, `hidden` applied, repositioned, de-duplicated),
  in render order. `MenuClient`, `MenuMenu`, `MenuMenuController`,
  `MenuMenuHelper`, `MenuDropdownItem` need **no change**.
- The frontend must render the entries **verbatim and in order** — no cap, no
  sort, no de-dup, no reinterpretation.
- The **only** functional change is a scrollable dropdown panel for long lists:
  `max-height` (≈ viewport minus navbar) + `overflow-y: auto`, applied to the
  `<ul>` in `MenuDropdown` **only** — `LinksDropdown` stays untouched.
- After the change, rebuild the SPA into `source/static/` and commit the build
  output (same as IMPL-1).

## Steps

- [01 — Scrolling dropdown panel](frontend/01-scrolling-dropdown-panel.md)
- [02 — Frontend specs](frontend/02-frontend-specs.md)
- [03 — Rebuild the SPA](frontend/03-rebuild-spa.md)
- [04 — Update docs/agents/frontend.md](frontend/04-update-frontend-doc.md)

## CI Checks

- `frontend`: `npm run lint && npm run report && npm run test` (CircleCI:
  `checks-frontend`, `jasmine-frontend`)

## Notes

- Styling convention in this SPA: a co-located `*.css` file `import`ed from its
  JSX (see `MemoryStatus.jsx` → `./MemoryStatus.css`). Bootstrap is global via
  `main.jsx`. Use a dedicated class (e.g. `menu-dropdown-panel`) rather than
  restyling the global `.dropdown-menu`, so `LinksDropdown` is unaffected.
- The dropdown `<ul>` is emitted by `MenuDropdownHelper.renderEntries`
  (`<ul className="dropdown-menu show">`), not by `MenuDropdown.jsx` directly.

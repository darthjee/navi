# Issue: Reduce Codacy duplication in Menu and Links dropdown specs

## Description
Codacy reports 18% code duplication for the repository (the project goal is 10%). This issue tackles the menu and links components, which are structural siblings: the `*Menu` specs (fetch-driven) and the `*Dropdown` specs (presentational) of `Menu` and `Links` repeat the same scenarios with only the component, label and data shape changing.

Figures below come from Codacy's analysis of `main` at `f25bf98`.

## Problem
| File | Lines | Clones | Duplicated lines |
| --- | ---: | ---: | ---: |
| `frontend/spec/components/MenuMenu_spec.js` | 201 | 16 | 146 |
| `frontend/spec/components/MenuDropdown_spec.js` | 82 | 6 | 64 |
| `frontend/spec/components/LinksMenu_spec.js` | 69 | 10 | 97 |
| `frontend/spec/components/LinksDropdown_spec.js` | 61 | 5 | 59 |

- `MenuMenu` and `LinksMenu` share the same scenarios (no entries renders nothing; entries render a toggle button, its label, no anchors before opening and N anchors with the configured text after the click; fetch failure renders nothing) and the same import/setup block (lines 5-9 / 7-11), including a local copy of `flushAsync`, which already exists in `frontend/spec/support/async.js`
- `MenuDropdown` and `LinksDropdown` share the same scenarios (closed: button, label, no anchors, `aria-expanded=false`; open: N anchors, text, `aria-expanded=true`; toggle click calls `setOpen`) and the same render helper, differing only in component, label, data shape (`entries` with `route` vs `links` with `url`) and the `MemoryRouter` wrapper
- `MenuMenu_spec.js` also has the "merging extension routes" block, whose 5 scenarios each rebuild the same fetch stub + render + flush + open-menu sequence

## Expected Behavior
Codacy reports markedly fewer duplication clones for the files above, and behaviour is unchanged (the affected specs still pass and still verify the same scenarios).

## Solution
All changes stay in `frontend/spec/`, owned by the `frontend` agent; no production code (`frontend/src/`) and no Codacy configuration/threshold changes.

- Add two shared-example files to `frontend/spec/support/`, following the `itBehavesLike...` style of `fetch_states.js` and `logs.js` (they take `{ state, render, ... }` and register `describe`/`it` blocks):
  - a dropdown file (e.g. `dropdown.js`) exporting `itBehavesLikeDropdown`, parameterised by label, items and how to render, used by `MenuDropdown_spec.js` and `LinksDropdown_spec.js`
  - a fetched-menu file (e.g. `fetched_menu.js`) exporting `itBehavesLikeFetchedMenu` for the behaviour common to `MenuMenu_spec.js` and `LinksMenu_spec.js` (no entries, entries + toggle/open, fetch failure)
- Extract the extension-merging scaffolding of `MenuMenu_spec.js` (stub `/menu.json` and `/extensions/frontend.json`, render, flush, open the menu) into a helper in `support/` (e.g. alongside the fetched-menu file), so each of the 5 scenarios becomes its inputs plus one assertion
- Replace the local `flushAsync` copies in `MenuMenu_spec.js` and `LinksMenu_spec.js` with the import from `support/async.js`; leave `useContainer` (`support/dom.js`) as is
- Menu-only checks stay in their own spec (the 25-entry case, `menu-dropdown-panel` class assertions, `resetExtensionsCache`)
- Keep every existing assertion and scenario: the refactor must not reduce what the specs verify
- Prefer readability over maximal de-duplication; do not introduce abstractions that make a failing spec harder to read

## Benefits
- Lowers the repository duplication percentage reported by Codacy
- Makes the affected files shorter and easier to extend, so new scenarios need one line instead of a copied block

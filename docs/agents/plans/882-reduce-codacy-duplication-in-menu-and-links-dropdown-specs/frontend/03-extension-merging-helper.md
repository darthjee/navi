# Extension-merging helper
The "merging extension routes" block in `MenuMenu_spec.js` has 5 scenarios that each repeat: stub `fetch` (`/menu.json`, `/extensions/frontend.json`, reject anything else), render, `flushAsync`, open the menu, then assert on anchor texts. Extract that into a helper in `frontend/spec/support/fetched_menu.js` (or a sibling file if it reads better), e.g. `renderMenuWithExtensions({ state, render, menu, manifest })`, together with the small helpers only this block uses (`jsonResponse`, `fixture`, `anchorTexts`, `waitForButton`, `openMenu`), so each scenario reduces to its `menu`/`manifest` inputs plus one `it`.

Cover the five existing scenarios unchanged: extension route not listed or hidden (appended after menu-file entries), route listed in `hidden` (omitted), route already in the menu entries (not duplicated), manifest request fails (menu-file entries still render, `console.warn` silenced), menu request fails but extensions load (extension entries still render, `console.warn` silenced). The last scenario stubs `/menu.json` with a non-OK response, so the helper must accept a raw response/promise for the menu, not only a JSON body.

## Files to Change
- `frontend/spec/support/fetched_menu.js` — add the extension-merging helper and its supporting functions
- `frontend/spec/components/MenuMenu_spec.js` — rewrite the "merging extension routes" block on top of the helper

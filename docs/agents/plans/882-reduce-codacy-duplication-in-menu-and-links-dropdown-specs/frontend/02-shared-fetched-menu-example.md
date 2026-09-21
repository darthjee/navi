# Shared fetched-menu example
Create `frontend/spec/support/fetched_menu.js` exporting `itBehavesLikeFetchedMenu({ state, render, label, dataKey, items })`, where `dataKey` is the response key (`entries` or `links`) and `render` is an async no-argument function that renders the component into `state.root` (the `MemoryRouter` wrapper for `MenuMenu` lives in the spec's own `render`). It registers the scenarios common to `MenuMenu` and `LinksMenu`, using `mockFetchSuccess`/`mockFetchFailure` from `support/fetch.js` and `flushAsync` from `support/async.js`:

- when fetch returns no items: renders nothing
- when fetch returns items: renders a toggle button, shows `label` on it, shows no anchors before opening; after clicking the button, shows one anchor per item and every item's text
- when fetch fails (503): renders nothing

`MenuMenu_spec.js` silences `console.warn` in its failure scenario; keep that behaviour (for example an optional flag, or spy in a `beforeEach` in the spec) rather than silencing it for `LinksMenu` if it does not warn.

Rewrite `MenuMenu_spec.js` and `LinksMenu_spec.js` to call it and delete their local `flushAsync` copies in favour of `import { flushAsync } from '../support/async.js'`. Menu-only scenarios stay in `MenuMenu_spec.js`: the 25-entry "passes every entry through unchanged / preserves the entry order" block, the outer `resetExtensionsCache()` `beforeEach`, and the extension-merging block (handled in step 03).

## Files to Change
- `frontend/spec/support/fetched_menu.js` — new; `itBehavesLikeFetchedMenu`
- `frontend/spec/components/MenuMenu_spec.js` — use the shared example, import `flushAsync`, keep the Menu-only scenarios
- `frontend/spec/components/LinksMenu_spec.js` — use the shared example, import `flushAsync`

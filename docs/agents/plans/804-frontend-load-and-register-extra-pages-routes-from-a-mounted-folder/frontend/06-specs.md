# `frontend/spec/` coverage

Reuse `spec/support` (`useContainer` from `support/dom.js`, `mockFetchSuccess` /
`mockFetchFailure` from `support/fetch.js`). Jasmine + jsdom, `npm run test`.

## `loadExtensions` (`spec/extensions/loadExtensions_spec.js`)

- manifest fetch fails / non-2xx / bad JSON / times out → resolves `[]`, warns,
  does not throw.
- `{ bundles: [] }` → `[]`.
- a bundle whose dynamic `import` rejects → skipped + warn; other bundles still
  load. (Stub the import — inject an importer fn, or point `src` at a data URL /
  a fixture module under `spec/`.)
- `mod.default` not an array → bundle skipped + warn.
- one invalid descriptor among valid ones → only the invalid one dropped.
- `bundle.css` present → a `<link>` is appended to `document.head` once.
- resulting order = manifest order then in-bundle order.

## Router integration (`spec/components/ExtensionRoutes_spec.js` or extend `main`/`Layout` spec)

- With a stubbed `loadExtensions` returning one `{ path: '/ext/reports', text:
  'Reports', component: Reports }`, render the same router tree `main.jsx` builds
  and assert:
  - navigating to `#/ext/reports` renders `Reports` inside the stock `Layout`
    (navbar present).
  - the stock routes still render unchanged.
- With `loadExtensions` returning `[]`, the rendered tree matches the current
  stock-only expectation (guard against regressions in `main.jsx`).
- A `component` that throws on render → `ExtensionErrorBoundary` shows the inline
  alert; navigating back to a stock route still works.

Factor the router tree out of `main.jsx` into a testable element if needed (e.g.
`buildRouter(extensionRoutes)`), keeping `main.jsx` as the thin
`bootstrap()` caller.

## `ExtensionErrorBoundary` (`spec/components/ExtensionErrorBoundary_spec.js`)

- renders children when no error.
- renders the inline alert (not a blank page) when a child throws; warns.

## Menu merge (`spec/components/MenuMenu_spec.js` — extend)

- `mockFetchSuccess({ entries: [{route:'/logs',text:'Logs'}], hidden: [] })` +
  stubbed `loadExtensions` → extension entry appears **after** `Logs`.
- extension route present in `hidden` → not shown.
- extension route already in `entries` → not duplicated.
- `loadExtensions` rejects / menu fetch fails → menu still renders the other
  source's entries (no throw).

## Files to Change

- `frontend/spec/extensions/loadExtensions_spec.js` — new.
- `frontend/spec/components/ExtensionErrorBoundary_spec.js` — new.
- `frontend/spec/components/ExtensionRoutes_spec.js` — new (or extend an existing
  router spec).
- `frontend/spec/components/MenuMenu_spec.js` — extend for the merge cases.
- `frontend/spec/support/` — add a fixture extension module if the import stub
  needs one.

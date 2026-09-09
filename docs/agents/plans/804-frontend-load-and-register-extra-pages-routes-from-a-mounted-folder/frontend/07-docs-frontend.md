# Update `docs/agents/frontend.md`

Document the runtime extension-loading mechanism on the SPA side.

## Changes

- **Source layout** block: add `src/extensions/` with `loadExtensions.js` and
  `ExtensionErrorBoundary.jsx`; note `main.jsx` now bootstraps asynchronously.
- **Routing** section: add a paragraph — extension routes from mounted bundles
  are appended after the stock routes, under `ExtensionErrorBoundary`, inside the
  `Layout` outlet; reached at `#<path>` like any stock route; absent when no
  extension is mounted (`GET /extensions/frontend.json` → `{ bundles: [] }`).
- New short **`## Extensions`** section: the flow (fetch manifest → `import()`
  each `frontend/*.js` → validate `{ path, text, component }` default export →
  merge routes + menu entries), the single-React-instance import map in
  `index.html` + the `react-vendor` chunk in `vite.config.js`, the skip-and-warn
  failure policy, and pointers to `docs/agents/web-server.md`
  (`/extensions/frontend*` routes, `/menu.json` `hidden`) and
  `docs/agents/future/extension-architecture.md` `## Frontend` for the full spec.
- **`MenuClient.js`** layout comment: note it now also carries the `hidden` list
  used to filter extension menu entries.

## Files to Change

- `docs/agents/frontend.md` — layout entry, Routing note, new `## Extensions`
  section, `MenuClient` comment.

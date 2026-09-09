# `src/extensions/ExtensionErrorBoundary.jsx`

A class component error boundary wrapping only the extension `<Route>` subtree, so
a throwing extension page can never blank the navbar or the stock pages.

## Behaviour

- `static getDerivedStateFromError()` → `{ hasError: true }`.
- `componentDidCatch(error, info)` → `console.warn('[extensions] route component threw', error, info)`.
- Render: on error, a small inline Bootstrap alert (e.g.
  `<div className="alert alert-warning">This extension page failed to load.</div>`)
  — **not** a full-page takeover. Otherwise `this.props.children`.
- Used as a layout route: `<Route element={<ExtensionErrorBoundary />}>` with the
  extension `<Route>`s as children, so it renders an `<Outlet />` when there is no
  error. (If used as a plain wrapper component instead, render `children`; match
  whichever form `main.jsx` step 04 wires up — a layout route with `<Outlet />`
  is the cleaner fit for nested `<Route>`s.)

Note: React error boundaries only catch render/lifecycle errors, not async ones;
that is acceptable per the spec (async load failures are already handled by
`loadExtensions` skip-and-warn).

## Files to Change

- `frontend/src/extensions/ExtensionErrorBoundary.jsx` — new file.

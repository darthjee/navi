# Add the router render helper
Every page spec hand-builds `MemoryRouter` / `Routes` / `Route` (and, in `CategoryPage_spec.js` / `CategoryItemPage_spec.js`, a `NavigationCapture` component that stores `useNavigate()`), differing only in path, route pattern and component.

Create `dev/frontend/spec/support/render_page.js` exporting a factory, for example `createPageRenderer(state, { route, element, defaultPath })`, that returns `{ render, navigate }`:
- `render(path = defaultPath)` renders, through `renderInAct(state.root, ...)`, a `MemoryRouter` with `initialEntries: [path]` containing a `NavigationCapture` and `Routes`/`Route` for `route` with `element`;
- `navigate(to)` calls the captured navigate function inside `act` (used by the `when the id changes` scenario).

It lives in `dev/frontend/spec/support/` (not in `spec-support`) because it depends on `react-router-dom`. `CategoriesIndexPage` is rendered without a `Route` today (`MemoryRouter` only, no params); the helper may render the element under a catch-all `Route` (`path: '*'`) or expose a mode for it, as long as that spec's behaviour and assertions do not change.

## Files to Change
- `dev/frontend/spec/support/render_page.js` — new router render helper

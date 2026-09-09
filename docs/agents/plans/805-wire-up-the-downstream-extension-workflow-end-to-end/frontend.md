# Frontend Plan: Wire up the downstream extension workflow end to end

Main plan: [plan.md](plan.md)

## Shared contracts

The host SPA must resolve the **same** React specifiers that an externally built
extension bundle marks as `external`. Today `frontend/index.html`'s importmap and
the `react-vendor` `manualChunks` array list only:

```
react, react-dom, react-dom/client, react-router-dom
```

`@vitejs/plugin-react` uses the automatic JSX runtime, so a `vite build --lib`
extension bundle emits `import { jsx } from "react/jsx-runtime"` (and
`react/jsx-dev-runtime` in dev). Those specifiers have no importmap entry, so the
browser cannot resolve them and the extension page silently fails to mount.

After this change the externalised list (host + example) is:

```
react, react-dom, react-dom/client, react-router-dom, react/jsx-runtime, react/jsx-dev-runtime
```

The `guide` agent's `vite.config.js` externalises the full six; this plan file
covers the host side.

## Implementation Steps

### Step 1 — Add `react/jsx-runtime` to the importmap and the vendor chunk

- `frontend/index.html` — add two keys to the importmap `imports` object, both
  pointing at `/assets/react-vendor.js` (same target as the existing four):
  `"react/jsx-runtime"` and `"react/jsx-dev-runtime"`.
- `frontend/vite.config.js` — add `'react/jsx-runtime'` and
  `'react/jsx-dev-runtime'` to the `manualChunks['react-vendor']` array so those
  modules are bundled into the unhashed `assets/react-vendor.js` chunk the
  importmap points at (otherwise the keys resolve to a file that does not contain
  them).

Verify with `yarn build` in `frontend/` that `assets/react-vendor.js` is still
emitted unhashed and now contains the jsx-runtime exports.

### Step 2 — Cover the change in a spec

Extend the existing importmap/extension-loading coverage (e.g. alongside
`frontend/spec/extensions/loadExtensions_spec.js` or a small
`frontend/spec/index_html_importmap_spec.js`) to assert the importmap exposes
`react/jsx-runtime` → `/assets/react-vendor.js`. Keep it minimal; the real
end-to-end proof is the `smoke-extensions` job.

## Files to Change

- `frontend/index.html` — two new importmap keys.
- `frontend/vite.config.js` — two new entries in `manualChunks['react-vendor']`.
- `frontend/spec/...` — a spec asserting the importmap entry (small).

## CI Checks

- `frontend`: existing `jasmine-frontend` + `checks-frontend` CircleCI jobs.
  Local: `docker compose run --rm navi_tests` then `cd ../frontend && yarn coverage`
  (or the repo's usual frontend spec command).

## Notes

- Do not switch the app build to externalise React — this is an app bundle, React
  stays a real chunk; only the importmap surface is being widened so *extension*
  bundles (which are built elsewhere with React external) can borrow the same
  instance.
- If `react-router-dom` (exact pin `7.14.2`) ever re-exports something the
  extension needs that is not in the vendor chunk, that is a separate follow-up;
  scope here is only the jsx runtime.

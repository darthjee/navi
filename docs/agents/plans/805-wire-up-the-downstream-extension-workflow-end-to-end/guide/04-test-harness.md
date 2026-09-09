# Standalone Jasmine test-support harness

The example runs its specs in its **own** Jasmine process (SPEC-6 isolation
rule). `frontend/spec/support/` cannot be reused across the package boundary
(it is wired through npm scripts, `loader.js` hard-codes a relative path, and
`frontend/` has no `jasmine.json`). Ship byte-compatible copies now; #806 later
replaces them with image-baked originals.

## What to do

Copy **verbatim** from `frontend/spec/support/` into
`examples/navi-orders-extension/spec/support/`:

- `loader.js` — `register('./transform_hooks.js', import.meta.url)`.
- `transform_hooks.js` — esbuild `load` hook: `.jsx` → `{ loader: 'jsx',
  jsx: 'automatic', format: 'esm' }`; `.css/.scss/.sass/.less` → `export default {}`.
- `dom.js` — single JSDOM on `globalThis`, `useContainer()` lifecycle,
  `IS_REACT_ACT_ENVIRONMENT = true`, hand-rolled `act` + `createRoot` (no
  `@testing-library`). If a spec needs `navigator` / `location`, take those two
  extra global assignments from `dev/frontend/spec/support/dom.js`.
- `fetch.js` — `mockFetchSuccess(data)` / `mockFetchFailure(status)`
  (`spyOn(globalThis, 'fetch')`).

Add `spec/support/jasmine.json`, mirroring `dev/frontend/spec/support/jasmine.json`
but with a `.jsx`-aware glob:

```json
{
  "spec_dir": "tests",
  "spec_files": ["**/*[sS]pec.{js,jsx}"],
  "helpers": ["../spec/support/dom.js"]
}
```

(Adjust `spec_dir` / `helpers` relative paths to whatever layout the `test`
script in `package.json` expects — the specs live under `tests/backend/` and
`tests/frontend/`, the support files under `spec/support/`. Keep specs and
support in sibling trees exactly as `dev/frontend/` does, or fold specs under
`spec/` if that is simpler to wire — the fixed requirement is that
`orders_page_spec.jsx` is discovered and the `.jsx` transform hook is active.)

## Files to Change

- `examples/navi-orders-extension/spec/support/loader.js` — new (copy).
- `examples/navi-orders-extension/spec/support/transform_hooks.js` — new (copy).
- `examples/navi-orders-extension/spec/support/dom.js` — new (copy, +2 globals if needed).
- `examples/navi-orders-extension/spec/support/fetch.js` — new (copy).
- `examples/navi-orders-extension/spec/support/jasmine.json` — new.

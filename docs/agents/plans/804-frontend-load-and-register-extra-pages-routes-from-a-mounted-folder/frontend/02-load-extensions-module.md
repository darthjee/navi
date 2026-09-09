# `src/extensions/loadExtensions.js`

The boot-time module that turns the manifest into a validated list of route
descriptors. Pure logic + `fetch` + dynamic `import` — no React. Follows the
`clients/` + `controllers/` split style (a plain module of static functions).

## API

```js
// Resolves to an array of { path, text, component } — never rejects.
export async function loadExtensions() { ... }
```

Steps:

1. `fetch('/extensions/frontend.json', { signal })` with an `AbortController`
   ~2 s timeout. Any network error, non-2xx, JSON parse error, or timeout →
   `console.warn(...)`, return `[]`.
2. Parse `{ bundles }`. If `bundles` is not an array → return `[]`.
3. For each `bundle` **in array order**:
   - if `bundle.css` is a string, append
     `<link rel="stylesheet" href={bundle.css}>` to `document.head` (dedupe by
     href).
   - `mod = await import(/* @vite-ignore */ bundle.src)` inside try/catch →
     on throw, `console.warn('[extensions] skipping', bundle.src, err)`, continue.
   - `descriptors = mod.default`. If not an array → `console.warn`, skip bundle.
   - validate each descriptor (shared contract #3): `path` is a non-empty string,
     starts with `/`, no whitespace; `text` is a non-empty string; `component` is
     a function. Invalid → `console.warn('[extensions] skipping descriptor', i,
     'in', bundle.src)`, skip **that descriptor** only.
   - push survivors onto the result.
4. Return the flattened survivor list (order = manifest order, then in-bundle
   order).

Keep a module-level cache so `loadExtensions()` runs its fetch/imports once even
if called from both `main.jsx` and the menu merge (step 05) — e.g.
`let promise; export const loadExtensions = () => (promise ??= doLoad());`.

## Files to Change

- `frontend/src/extensions/loadExtensions.js` — new file.
- `frontend/src/extensions/` — new directory (also holds the error boundary,
  step 03).

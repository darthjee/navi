# Part 3 — Specs

## Goal

Cover the new and updated handlers with unit tests.

## Steps

- Add `source/spec/lib/server/IndexRequestHandler_spec.js` — verify `index.html` is served for `/`.
- Add `source/spec/lib/server/AssetsRequestHandler_spec.js` — verify:
  - Valid asset paths are served correctly.
  - Path traversal attempts (e.g. `../secret`) are rejected with 403.
- Update `source/spec/lib/server/Router_spec.js` if the catch-all or static routes change.

## Files to Change

- `source/spec/lib/server/IndexRequestHandler_spec.js` — new
- `source/spec/lib/server/AssetsRequestHandler_spec.js` — new
- `source/spec/lib/server/Router_spec.js` — update if needed

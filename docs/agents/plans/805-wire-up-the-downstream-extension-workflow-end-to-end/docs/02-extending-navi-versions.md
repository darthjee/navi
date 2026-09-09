# De-stale version pins + derived-image link in `extending-navi.md`

The guide's `vite build --lib` skeleton and worked-example `package.json`
(~lines 149-178, 231-245) are stale: `vite: "^5"`, `@vitejs/plugin-react: "^4"`,
`react`/`react-dom`/`react-router-dom: "<match base image>"`. The current
`frontend/package.json` is `react ^19.2.0`, `react-dom ^19.2.0`,
`react-router-dom 7.14.2` (exact), `vite ^7.2.4`, `@vitejs/plugin-react ^5.1.1`,
`esbuild ^0.28.0`, `jsdom ^25.0.0`, `jasmine ^5.0.0`.

## What to do

- Update the guide's `vite.config.js` skeleton and `package.json` example to real
  pins matching `frontend/` (and the `examples/navi-orders-extension/` project
  the `guide` agent is committing in this same PR — the two must agree exactly).
- In the externals list, keep `react/jsx-runtime` **and** add
  `react/jsx-dev-runtime` — and add a sentence explaining that the host SPA's
  importmap now provides both (the `frontend` agent's change), so extension
  bundles must externalise them, not bundle them.
- Replace the "Baking into a derived image" prose-only Dockerfile with a pointer
  to the now-committed `dockerfiles/navi_hey_extension_example/Dockerfile`
  (`docker` step 03), quoting it, and note the `COPY ... /home/node/app/config/menu.yml`
  target (not `/navi/menu.yml`).
- Add a short "See it working" line pointing at the `navi_extensions_app` compose
  service and `make smoke-extensions`.
- Replace the `"<match base image>"` upgrade-checklist guidance with the concrete
  "match `frontend/package.json` majors" instruction.

## Files to Change

- `docs/guides/navi/extending-navi.md` — version pins in the two code blocks,
  externals note, derived-image section, "See it working" pointer.

## Notes

- Coordinate the exact `devDependencies` JSON with the `guide` agent so the guide
  and `examples/navi-orders-extension/package.json` are copy-paste identical.

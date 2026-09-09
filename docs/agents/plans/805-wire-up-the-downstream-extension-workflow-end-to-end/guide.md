# Guide Plan: Wire up the downstream extension workflow end to end

Main plan: [plan.md](plan.md)

## Shared contracts

Build `examples/navi-orders-extension/` so that `npm run build` produces exactly
the `dist/` layout in plan.md › Shared contracts › "`dist/` layout ↔ compose
mount", serving the fixed SPEC-5 identifiers in plan.md › Shared contracts ›
"Worked-example identifiers". The backend handler imports
`import { RequestHandler } from 'navi-hey/extension'` verbatim. The Vite library
build externalises `react, react-dom, react-dom/client, react-router-dom,
react/jsx-runtime, react/jsx-dev-runtime` (the `frontend` agent widens the host
importmap to match). Example specs run in their own Jasmine process via a
standalone `spec/support/jasmine.json` with glob `**/*[sS]pec.{js,jsx}`.

This agent owns **only** `examples/`. It cannot start until `architect` has
committed `.claude/agents/guide.md` (plan.md › Bootstrap ordering).

## Steps

- [01 — Scaffold the example package + build config](guide/01-scaffold-package.md)
- [02 — Backend handler (`src/backend/orders.js`)](guide/02-backend-handler.md)
- [03 — Frontend page (`src/frontend/`)](guide/03-frontend-page.md)
- [04 — Standalone Jasmine test-support harness](guide/04-test-harness.md)
- [05 — Example specs (backend + frontend, Jasmine)](guide/05-specs.md)

## CI Checks

- `examples/navi-orders-extension`: `npm ci && npm run build` and
  `npm ci && npm test`, runnable locally. Exercised in CI by the
  `smoke-extensions` job (build only); the full downstream test image is #806.

## Notes

- Keep `spec/support/{loader,transform_hooks,dom,fetch}.js` **byte-identical** to
  `frontend/spec/support/` (copy, do not re-derive) so #806 can later swap in
  image-baked originals with no spec changes. `dev/frontend/spec/support/` is the
  reference for the accompanying standalone `jasmine.json`.
- Use **npm** (`npm ci` / `npm run`), not Yarn — the example is a stand-in for a
  downstream consumer project. Add a one-line note in the example's `README.md`
  (or a `package.json` comment) saying this is intentional.
- The worked example must stay byte-aligned with the "Worked example" section of
  `docs/guides/navi/extending-navi.md`; the `docs` agent is updating that section
  in the same PR (version pins, menu path). Coordinate on the final
  `package.json` `devDependencies` block.
- `dist/` is git-ignored; do not commit built output.

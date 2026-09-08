# SPEC-5 re-alignment; quasi-public doubles; cross-references and deferred list

Finish `docs/agents/future/downstream-extension-tests.md` with the sections that
close the loop with SPEC-5 and name what IMPL-6 inherits.

## SPEC-5 re-alignment section

SPEC-5 §7.2 / §9 explicitly defer to this issue and say "if SPEC-6 lands first,
its conventions win". Restate both worked-example tests in Jasmine form, keeping
SPEC-5's fixed identifiers (`OrdersSummaryHandler`, `GET /ext/orders/summary.json`,
`OrdersPage`, route `/ext/orders`, label `Orders`):

- **`tests/backend/orders_spec.js`** — replace `node:test` + `node:assert` with
  Jasmine: `describe` / `it`, `expect(route.method).toBe('GET')`, a
  `res = { json: jasmine.createSpy('json') }` double, `new route.handler({}, res).handle()`,
  `expect(res.json).toHaveBeenCalledWith(jasmine.objectContaining({ service: 'orders-extension' }))`.
- **`tests/frontend/orders_page_spec.jsx`** — replace `vitest` +
  `@testing-library/react` with the Navi frontend style: `import { useContainer }
  from` the baked `support/dom.js`, `const state = useContainer()`,
  `spyOn(globalThis, 'fetch').and.returnValue(Promise.resolve({ ok: true, json: () =>
  Promise.resolve({ pending: 3, service: 'orders-extension' }) }))` (or
  `mockFetchSuccess`), render `OrdersPage` into `state.root` inside `await act`,
  `expect(state.container.textContent).toContain('3 pending order(s)')`.
- Note the filename change (`*.spec.js`/`*.spec.jsx` → `*_spec.js`/`*_spec.jsx`)
  so IMPL-5's `spec/fixtures/extensions/` fixture and the user-guide retelling
  match Navi's `**/*[sS]pec.js` glob. State that IMPL-5 (#805) and the
  `extending-navi.md` guide must be updated to these two Jasmine versions when
  this spec lands (recorded as a follow-up, not done here).

## Quasi-public test doubles section

Name the exact promoted set and the import specifier, ending on one recommendation:

- **Backend** — from `source/spec/support/`: recommend a small curated list
  (e.g. request/response spy builders under `utils/`, `dummies/` model stubs, a
  `LoggerUtils` silencer) — not the whole tree. List each promoted module and what
  it is for. Flag the ones tied to Navi internals (`NamespaceMap`, registries) as
  **not** promoted, since extensions must not depend on those.
- **Frontend** — `support/dom.js` (`useContainer`) and `support/fetch.js`
  (`mockFetchSuccess` / `mockFetchFailure`), promoted as-is.
- **Import specifier** — recommend a `navi-hey` subpath (candidate
  `navi-hey/testing`) exposed via `source/package.json` `exports`, added to the
  `files` allowlist so it is actually published, and resolvable from the mounted
  folder via the symlink from step 03. Note that today `source/package.json`
  `files` is `["bin", "lib", "static"]` and `frontend/` is unpublished — the
  mechanical `exports` / `files` / packaging change is **IMPL-6's**, this doc only
  fixes the string and the set.
- State clearly these doubles are *quasi-public API* — usable from extension
  tests, may change between Navi tags (SPEC-5 §8 upgrade checklist covers the
  re-test).

## Cross-references and deferred list

- **Cross-references** — link `#794`, `extension-architecture.md` (SPEC-3/4),
  `downstream-extension-workflow.md` (SPEC-5), `menu-configuration.md`,
  `docs/guides/navi/extending-navi.md`, and `CLEAN-1 (#807)`. If
  `extension-architecture.md` / `downstream-extension-workflow.md` lack a
  back-pointer to this new file, add a one-line "see also" there (small edit,
  no contract change).
- **Deferred / out of scope** — mirror the sibling specs' posture: extension npm
  dependencies not in the image; recursive `tests/` subdirectories beyond
  `backend/` + `frontend/`; end-to-end / integration tests that boot a real Navi
  container (the harness is unit-level); coverage-threshold gating; a published
  standalone npm test-helper package (the image is the delivery mechanism);
  multi-bundle extension repos.
- **Handoff to IMPL-6** — a short bullet list of the mechanical decisions this
  doc deliberately leaves to IMPL-6: final image name, one-image-vs-two,
  the shared-base-layer question, exact mount paths, the final promoted double set
  + `exports` / `files` wiring, and the `.circleci` job wiring.

## Files to Change

- `docs/agents/future/downstream-extension-tests.md` — add the **SPEC-5
  re-alignment**, **Quasi-public test doubles**, **Cross-references**, and
  **Deferred / out of scope** sections.
- `docs/agents/future/extension-architecture.md` — *optional* one-line "see also"
  pointer to the new file, only if missing.
- `docs/agents/future/downstream-extension-workflow.md` — *optional* one-line "see
  also" pointer to the new file, only if missing (SPEC-5 §9 already references
  SPEC-6 by number — a link is enough).

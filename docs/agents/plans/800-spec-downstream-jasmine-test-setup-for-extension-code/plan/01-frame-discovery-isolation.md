# Frame the document; Discovery and Isolation sections

Create `docs/agents/future/downstream-extension-tests.md` and write its opening
frame plus the two sections that establish *where extension specs live* and *why a
run cannot bleed into Navi's own suites*.

## Header / frame

Mirror the house style of `extension-architecture.md` and
`downstream-extension-workflow.md`:

- One-line "Part of #794 (**extension track**) — this is **SPEC-6**." plus the
  transient-document notice (removed by **CLEAN-1 (#807)**; durable parts fold into
  `docs/guides/navi/extending-navi.md` / `docs/agents/frontend.md` /
  `docs/agents/web-server.md`).
- A short "What this file owns" list: the extension test *harness* — discovery,
  the backend and frontend run modes, isolation, the dedicated test image, and CI
  — as opposed to `extension-architecture.md` (the container contract) and
  `downstream-extension-workflow.md` (the author's project layout).
- A "Scope & relationship to SPEC-3 / SPEC-4 / SPEC-5" table that **reuses
  verbatim** (never re-decides): the `/navi/extensions` layout, the backend
  `{ method, path, handler }` descriptor and error mapping, the frontend
  `{ path, text, component }` descriptor, the `navi-hey/extension` specifier and
  the symlink-above-mount rule (SPEC-5 §1), and SPEC-5 §7.2's two worked-example
  identifiers (`orders`, `/ext/orders`, `/ext/orders/summary.json`,
  `OrdersSummaryHandler`, `OrdersPage`, menu label `Orders`).
- State the one contract item this document settles: **the runner is Jasmine, and
  SPEC-5 §7.2's `node --test` / `vitest` examples are superseded** (detailed in
  step 04).

## Discovery section

Answer "where do the extension's spec files live and how does the runner find only
them":

- The specs live in the **author's own project**, not in the mounted `dist/`
  (`/navi/extensions` carries built artefacts only). Recommend the SPEC-5 §2
  layout: `tests/backend/*[sS]pec.js` and `tests/frontend/*[sS]pec.js` (rename
  SPEC-5's `orders.spec.js` / `orders-page.spec.jsx` to `*_spec.js` /
  `*_spec.jsx` to match Navi's `**/*[sS]pec.js` glob — note this alignment for
  SPEC-5).
- Recommend the tests run against the **pre-build source** (`src/backend/*.js`,
  `src/frontend/*.jsx` + `entry.js`), exactly as SPEC-5 §7.2 does — the frontend
  esbuild loader handles `.jsx` at import time, so no build step is needed before
  testing.
- The dedicated image (step 03) ships a baked `jasmine.json` per suite whose
  `spec_dir` / `spec_files` point at the **mounted** `tests/backend` /
  `tests/frontend` folder — the folder is the single source of truth, the author
  writes no manifest.
- Recommend one concrete discovery rule (e.g. "backend specs =
  `<mount>/tests/backend/**/*_[sS]pec.js`, frontend specs =
  `<mount>/tests/frontend/**/*_[sS]pec.@(js|jsx)`"), lexicographic order.

## Isolation guarantees section

Enumerate, each ending on a concrete recommendation:

- **Independent `jasmine.json`** — the baked configs set `spec_dir` to the mounted
  test tree, so Navi's baked `source/spec/` and `frontend/spec/` are never
  enumerated. The image must not put Navi's own `spec_files` globs on the load
  path.
- **No global cross-contamination** — the frontend jsdom globals come from the
  reused `support/dom.js`; each spec file gets the standard `useContainer`
  `beforeEach`/`afterEach` teardown. The backend suite sets no globals. Recommend
  the image run backend and frontend as **separate Jasmine processes** (they need
  different loaders anyway), so neither suite's globals or `helpers` reach the
  other.
- **Coverage scoping** — `c8` `include` points at the author's `src/**`
  (`.js` + `.jsx`), `exclude` covers `tests/**`, `dist/**`, `node_modules/**`, and
  any baked Navi path. Recommend the image expose coverage as an opt-in command
  (`--coverage`) rather than the default, mirroring Navi's `yarn spec` vs
  `yarn test` split.
- **Version skew** — the baked doubles and toolchain are pinned to the image tag;
  restate SPEC-5 §8's "pin `FROM <navi tag>` and re-run" rule and that the doubles
  are *quasi-public API* that may change between tags.

## Files to Change

- `docs/agents/future/downstream-extension-tests.md` — **new file**; add its
  header/frame, the "Scope & relationship" table, the **Discovery** section, and
  the **Isolation guarantees** section.

# Issue: SPEC: downstream Jasmine test setup for extension code

## Description

Part of #794 (**extension track**) — this is **SPEC-6**. It produces one transient
architecture document, `docs/agents/future/downstream-extension-tests.md`, and **no
production code**. The document is deleted by **CLEAN-1 (#807)** once the feature
ships, with any durable guidance folded into the permanent extension guide
(`docs/guides/navi/extending-navi.md`).

Navi has two Jasmine suites today:

- **Backend** — `source/spec/`, run from `source/` with `npx jasmine spec/**/*.js`
  (`yarn spec` / `yarn test`). Config is the `jasmine` block in
  `source/package.json` (`spec_dir: spec`, `spec_files: **/*[sS]pec.js`, no
  helpers). Coverage is `c8` with `include: ["lib/**/*.js"]`. Reusable doubles
  live under `source/spec/support/{factories,dummies,utils,fixtures}`.
- **Frontend** — `frontend/spec/`, run from `frontend/` with
  `node --import ./spec/support/loader.js node_modules/.bin/jasmine spec/**/*.js`
  (`yarn spec` / `yarn test`). `loader.js` registers `transform_hooks.js` (esbuild
  JSX transform + CSS-import stubbing); the `jasmine` block adds
  `helpers: ["support/dom.js"]` (jsdom globals + `useContainer`);
  `support/fetch.js` exports `mockFetchSuccess` / `mockFetchFailure`. Coverage is
  `c8` over `src/**`. `frontend/` is a separate package (`navi-frontend`) and is
  **never published**.

Downstream developers writing extension code against SPEC-3 (backend route
handlers, #797) and SPEC-4 (frontend React pages/bundles, #798) — laid out per
SPEC-5 (#799) — currently have **no supported way to test it**. SPEC-5 §7.2
sketches two ad-hoc example tests using `node --test` and
`vitest` / `@testing-library`, but explicitly defers the real harness (runner
wiring, `spec/`-tree isolation, fixture plumbing) to this issue and states that if
SPEC-6 lands first, its conventions win.

## Problem

- No documented, supported Jasmine harness for extension code, backend or
  frontend.
- Navi's reusable test scaffolding is **not reachable** from a downstream project:
  the published `navi-hey` package ships only `["bin", "lib", "static"]` (no
  `spec/`), jasmine / jsdom / esbuild / c8 are dev-only dependencies, and the
  frontend `spec/support/*` files live in the never-published `navi-frontend`
  package.
- SPEC-5's example tests use two different non-Jasmine runners, contradicting #794
  goal 5 ("their own Jasmine suite ... runnable with Navi's tooling") and leaving
  IMPL-5's `spec/fixtures/extensions/` fixture without a settled convention.
- No stated isolation guarantee that an extension run will not pull in Navi's own
  `source/spec/` or `frontend/spec/` trees, share globals, or blend coverage.

## Solution

**Direction (agreed in discussion): a dedicated extension dev/test Docker image**,
a *sibling* of the production `navi-hey` image, following the pattern Tent uses
for its `darthjee/tent-test` image. The production image stays lean; all test
tooling lives only in this image.

The image:

- Is built `FROM` the same Node base as Navi's dev images (a shared
  `dev_navi_hey-base`-style layer is IMPL-6's call), so the runtime matches
  production — "what you test is what runs".
- **Bakes in** Navi's `source/` + its full dev toolchain (jasmine, c8, eslint) and
  the `frontend/` toolchain (jasmine, jsdom, esbuild) plus
  `frontend/spec/support/{loader,transform_hooks,dom,fetch}.js`.
- **Bakes in reusable test doubles** at a stable path — selected modules from
  `source/spec/support/{factories,dummies,utils}` and the `frontend/spec/support/*`
  helpers — documented as *quasi-public API* (usable from extension tests, may
  change between Navi versions), exactly like Tent's bundled doubles.
- **Bakes default `jasmine.json` configs** (one backend, one frontend) whose
  `spec_dir` / `spec_files` point at the **mounted** extension test folders, never
  Navi's baked `source/spec/` or `frontend/spec/` — this is the isolation
  guarantee.
- Consumes the **same** `/navi/extensions` mount as production, plus mounts for the
  author's pre-build extension `src/` and their spec files.
- Default `CMD` runs the author's suite(s) immediately; overridable for a shell,
  lint, or a single suite/file.
- Resolves `navi-hey/extension` (SPEC-5 §1) and the new test-double subpath from a
  spec file under the mounted folder via the same "symlink one level above the
  mount" trick SPEC-5 §1 already specifies.
- Is built and pushed by CI next to the production image, its own tags and arch
  variants, gated on Navi's own test/lint jobs passing.

**Runner: Jasmine only.** SPEC-5 §7.2 / IMPL-5's two example tests
(`orders.spec.js`, `orders-page.spec.jsx`) are re-stated in Jasmine form — the
backend one with `expect(...)`, the frontend one using `useContainer` +
`spyOn(globalThis, 'fetch')` from the baked support helpers and the esbuild `.jsx`
loader. The `node --test` / `vitest` / `@testing-library` variants are dropped.

Points the document must still settle, each ending on one concrete recommendation:

1. **Image naming** and whether backend + frontend are one image with two
   subcommands or two images.
2. **Exact mount points** for the author's `src/` and `tests/`, and how they relate
   to the built `dist/` at `/navi/extensions`.
3. **Which `source/spec/support/` modules** are promoted to the quasi-public
   double set and under what import specifier.
4. **CI wiring** shape for a downstream project (compose `run --rm`, container
   built `FROM` the pinned Navi tag).

## Expected Behavior

`docs/agents/future/downstream-extension-tests.md` exists and covers the
following, each ending on a single concrete recommendation:

- **Discovery** — where the extension's spec files live (mounted folder) and how
  the baked `jasmine.json` finds only them, never Navi's `source/spec/` or
  `frontend/spec/`.
- **Backend harness** — how extension specs load the extension modules (via the
  `navi-hey/extension` subpath fixed in SPEC-5 §1) and the baked Navi test
  doubles; the command to run them.
- **Frontend harness** — how the `spec/support` loader + jsdom setup (or a
  documented subset) is reused for extension pages; the command to run them.
- **Config-driven runs** — the "with Navi's tooling" answer: the dedicated
  image's baked default command, not a new yarn script inside Navi.
- **Isolation guarantees** — coverage scoping (`c8` `include` at the author's
  `src/`), no cross-contamination of globals, independent `jasmine.json`.
- **CI hook** — how a downstream project wires this into its own CI, including
  running against a container built `FROM` the pinned Navi tag.
- **SPEC-5 re-alignment** — the two example tests re-stated in Jasmine form.

## Benefits

- IMPL-6 can build the harness (and the image) without re-deciding discovery or
  isolation.
- IMPL-5's `spec/fixtures/extensions/` fixture gets one settled test convention.
- Extension authors get a first-class, Navi-consistent testing story — run one
  image, no toolchain to assemble — instead of improvising a runner per project.
- Production `navi-hey` stays minimal; test tooling ships only where tests run.

## Dependencies

Depends on **SPEC-3 (#797)** and **SPEC-4 (#798)** (the harness targets those
extension surfaces) and coordinates with **SPEC-5 (#799)** on the two example
tests. Feeds **IMPL-6 (#806)**. The dedicated image parallels the Tent
`darthjee/tent-test` pattern.

## Acceptance criteria

- [ ] `docs/agents/future/downstream-extension-tests.md` exists and covers every
      bullet above.
- [ ] A concrete recommendation for the dedicated test image (contents, mounts,
      default command) and how the suite is invoked and kept isolated.
- [ ] The two SPEC-5 §7.2 example tests are shown in their Jasmine form.
- [ ] IMPL-6 can build the harness without re-deciding discovery or isolation.

## Agents

architect (coordinating), with **docker** (the sibling image + CI wiring),
**engine** (backend harness + `source/spec/support` doubles) and **frontend**
(`frontend/spec/support` reuse) input.

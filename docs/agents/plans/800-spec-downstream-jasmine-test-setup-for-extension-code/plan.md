# Plan: SPEC: downstream Jasmine test setup for extension code

Issue: [800-spec-downstream-jasmine-test-setup-for-extension-code.md](../../issues/800-spec-downstream-jasmine-test-setup-for-extension-code.md)

## Overview

This is a **spec issue**: the only deliverable is one transient architecture
document, `docs/agents/future/downstream-extension-tests.md`, that tells IMPL-6
(#806) how downstream extension authors run a Jasmine suite (backend + frontend)
against their mounted extension code, isolated from Navi's own `source/spec/` and
`frontend/spec/` trees. No production code, Dockerfiles, or `source/` / `frontend/`
changes are made here — those belong to IMPL-6.

The agreed direction (from the discussion on #800) is a **dedicated extension
dev/test Docker image**, a lean-production *sibling* modelled on Tent's
`darthjee/tent-test` image: it bakes in both test toolchains and a curated set of
reusable Navi test doubles, ships default `jasmine.json` configs scoped to the
*mounted* extension test folders, consumes the same `/navi/extensions` mount as
production, and runs the author's suites as its default command. Jasmine is the
only supported runner, so SPEC-5 §7.2 / IMPL-5's two example tests are re-stated in
Jasmine form.

## Context

- **Backend suite** — `source/spec/`, run from `source/` with
  `npx jasmine spec/**/*.js` (`yarn spec` / `yarn test`). Config is the `jasmine`
  block in `source/package.json` (`spec_dir: spec`,
  `spec_files: ["**/*[sS]pec.js"]`, no helpers). Coverage is `c8` with
  `include: ["lib/**/*.js"]`. Handler specs use a hand-rolled `res` double with
  `jasmine.createSpy('json')` and instantiate handlers directly or via
  `HandlerConfig` (see `source/spec/lib/server/handlers/LinksHandler_spec.js`).
  Reusable doubles live under `source/spec/support/{factories,dummies,utils,fixtures}`.
- **Frontend suite** — `frontend/spec/`, run from `frontend/` with
  `node --import ./spec/support/loader.js node_modules/.bin/jasmine spec/**/*.js`.
  `loader.js` registers `transform_hooks.js` (esbuild JSX transform + CSS-import
  stubbing); the `jasmine` block adds `helpers: ["support/dom.js"]` (jsdom globals
  + `useContainer`); `support/fetch.js` exports `mockFetchSuccess` /
  `mockFetchFailure`. Component specs call `const state = useContainer()` at
  `describe` level and render into `state.root` / assert on `state.container` (see
  `frontend/spec/components/StatsHeader_spec.js`). Coverage is `c8` over `src/**`.
  `frontend/` is a separate package (`navi-frontend`), **never published**.
- **Publishing gap** — the published `navi-hey` package ships only
  `["bin", "lib", "static"]`; jasmine / jsdom / esbuild / c8 are dev-only. A
  downstream project cannot reach Navi's harness today.
- **Extension contract** — `docs/agents/future/extension-architecture.md`
  (SPEC-3/4) fixes the `/navi/extensions` volume with flat `backend/*.js` (plain
  ESM, `import { RequestHandler } from 'navi-hey/extension'`) and `frontend/*.js`
  (pre-built ESM bundle, React external). SPEC-5 §1 fixes the `navi-hey/extension`
  subpath and the `/navi/node_modules/navi-hey` symlink one level above the mount
  so the specifier resolves from a file under `NAVI_EXTENSIONS_DIR`.
- **SPEC-5 §7.2 / §9** show two ad-hoc example tests (`node --test` for
  `orders.spec.js`, `vitest` + `@testing-library` for `orders-page.spec.jsx`) and
  defer the real harness to this issue: "if SPEC-6 lands first, its conventions
  win". IMPL-5 (#805) lifts the worked example into `spec/fixtures/extensions/`.
- **Docker layout** — dev images (`dockerfiles/dev_navi_hey`, `dockerfiles/dev_frontend`,
  `dockerfiles/dev_frontend_app`) are `FROM darthjee/node:0.2.1` and warm the yarn
  cache via `yarn_builder.sh`; there is no shared `dev_navi_hey-base` layer today.
  The `navi_tests` compose service just reuses `navi:dev` with `source/`
  bind-mounted. Production image is `dockerfiles/production_navi_hey/Dockerfile`
  (`npm install -g navi-hey@<version>`, no toolchain). CI (`.circleci/config.yml`)
  runs per-package `jasmine` / `checks` jobs and a `build-and-release` job; there
  is **no CI job for `docs/**`**.

## Steps

- [01 — Frame the document; Discovery and Isolation sections](plan/01-frame-discovery-isolation.md)
- [02 — Backend and Frontend harness sections](plan/02-backend-frontend-harness.md)
- [03 — Dedicated test image; Config-driven runs; CI hook](plan/03-test-image-and-runs.md)
- [04 — SPEC-5 re-alignment; quasi-public doubles; cross-references and deferred list](plan/04-spec5-realignment-doubles-xref.md)

## CI Checks

- Doc-only change under `docs/agents/future/`. No CI job in `.circleci/config.yml`
  covers `docs/**` — the per-package `jasmine` / `checks` jobs do not run. Nothing
  to execute locally beyond a Markdown read-through.

## Notes

- Keep the document self-consistent with `extension-architecture.md` and
  `downstream-extension-workflow.md`: where they and this file disagree,
  `extension-architecture.md` wins (same rule SPEC-5 states). This file only adds a
  back-pointer to those docs if one is missing; it does not re-decide the container
  contract.
- The document must **end each section on a single concrete recommendation**
  (matching the house style of the other `docs/agents/future/` specs), while
  explicitly listing the mechanical decisions it hands to IMPL-6: exact image
  name, one-image-vs-two, exact mount paths, the promoted double set and its
  import specifier, and the downstream CI-wiring shape.
- To be deleted by **CLEAN-1 (#807)** once the feature ships; durable guidance is
  expected to fold into `docs/guides/navi/extending-navi.md` and/or
  `docs/agents/web-server.md` / `docs/agents/frontend.md` at that point — call this
  out in the document's header, as the sibling specs do.
- No `.claude/agents/` specialist owns `docs/agents/future/*`; this is architect
  (coordinator) work drawing on docker / engine / frontend knowledge. IMPL-6 is
  where docker / engine / frontend do implementation work.

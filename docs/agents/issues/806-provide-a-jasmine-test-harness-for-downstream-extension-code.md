# Issue: Provide a Jasmine test harness for downstream extension code

## Description

Part of #794 (**extension track**) — this is **IMPL-6**, the implementation of
**SPEC-6** ([`docs/agents/future/downstream-extension-tests.md`](../future/downstream-extension-tests.md)).
Its dependencies are all merged: **IMPL-3** (#803, backend loader), **IMPL-4**
(#804, frontend loader), and **IMPL-5** (#805, the `examples/navi-orders-extension/`
worked example).

SPEC-6 specifies a supported way for a project *built on top of Navi* to run a
Jasmine suite (backend + frontend) against its own mounted extension code, using
Navi's tooling and reusing Navi's own test doubles, without pulling in Navi's
`source/spec/` or `frontend/spec/` trees.

Today, IMPL-5 delivers only an **ad-hoc, per-project** harness: the example
copies `frontend/spec/support/{dom,fetch,loader,transform_hooks}.js` byte-for-byte
into its own `spec/support/`, hand-stubs `navi-hey/extension` via a local
`file:` dependency, and runs a single `jasmine.json`. Nothing is shipped, reusable,
or pinned to a Navi version.

SPEC-6's decisions are frozen; SPEC-6 §12 lists the mechanical calls it leaves to
this issue. The calls settled during refinement:

- **`navi-hey/testing` doubles are delivered baked in the image only** — no
  `source/package.json` `exports` / `files` change, `frontend/` stays unpublished.
  The specifier resolves at test time from a fixed baked path via the
  `/navi/node_modules/navi-hey` symlink.
- **Full CircleCI integration** — a version-tag-gated release job plus a PR-time
  self-test job (details in Solution).
- **`examples/navi-orders-extension/` is converted to consume the image** (SPEC-6
  §9 re-alignment), losing its Docker-free `npm test` by design.

If this issue and SPEC-6 disagree, SPEC-6 (and, above it,
`extension-architecture.md`) wins.

## Problem

- No shipped, reusable harness. Every extension author re-copies Navi's frontend
  support files and re-stubs `navi-hey/extension`; nothing tracks the Navi
  version those were taken from.
- No reusable test doubles. SPEC-6 §10 promotes a curated `navi-hey/testing`
  subpath (backend: outbound-HTTP stubs from `AxiosUtils`, logger silencers from
  `LoggerUtils`; frontend: `dom.js`, `fetch.js`), but nothing exposes it — there
  is no baked path and no symlink resolution for it.
- No isolation config. There is one combined `jasmine.json`, not the two
  `spec_dir`-scoped configs run as separate processes SPEC-6 §3 requires so
  backend/frontend globals, helpers, and coverage never cross-contaminate and
  Navi's own spec trees are never enumerated.
- No delivery mechanism. SPEC-6's answer to "runnable with Navi's tooling" is a
  dedicated lean-production sibling image (`darthjee/navi-hey-test`, modelled on
  `darthjee/tent-test`) baking both toolchains, the reused support files, the
  `navi-hey/testing` doubles, the two `jasmine.json` + `c8` configs, and the
  `/navi/node_modules/navi-hey` symlink — this image does not exist.
- No CI story. There is no CircleCI job that builds/releases the image, and no
  job that self-tests the harness against the IMPL-5 example.
- No user guide. `docs/guides/navi/extending-navi.md` still points testing at the
  transient design doc.

## Expected Behavior

- `docker compose run --rm extension_tests` (the image's baked default `all`)
  runs the example extension's backend **and** frontend specs and reports
  pass/fail; `backend` / `frontend` / `all` / `lint` / `sh` and an `--coverage`
  pass-through are available as overrides.
- Navi's `source/spec/` and `frontend/spec/` are never picked up by the extension
  runner, and the extension runner's specs are never picked up by Navi's own
  suites.
- Coverage and globals are isolated per SPEC-6: two separate Jasmine processes,
  each with its own `spec_dir`-scoped `jasmine.json`; `c8` `include` scoped to the
  author's `src/**`; coverage opt-in via `--coverage`.
- Extension specs resolve `navi-hey/extension` and `navi-hey/testing` identically
  to how the runtime container resolves them (same `/navi/node_modules/navi-hey`
  symlink; `navi-hey/testing` served from a baked path).
- A downstream project can wire this into its own CI as one job against an image
  pinned to the Navi tag it deploys `FROM`.
- `docs/guides/navi/extending-navi.md` covers extension testing directly (not by
  deferring to `docs/agents/future/`).

## Solution

Build the harness and its image from SPEC-6, with the refined §12 calls:

1. **`navi-hey/testing` doubles — image-baked only.** Promote the SPEC-6 §10 set
   (backend: `AxiosUtils` HTTP stubs → `navi-hey/testing/axios.js`,
   `LoggerUtils` silencers → `navi-hey/testing/logger.js`; frontend:
   `frontend/spec/support/{dom,fetch}.js` → `navi-hey/testing/{dom,fetch}.js`)
   to a fixed baked path in the image, exposed as the `navi-hey/testing` subpath
   via the `/navi/node_modules/navi-hey` resolution. No `source/package.json`
   `exports` / `files` change; `frontend/` stays unpublished.
2. **Two isolation configs.** Baked backend and frontend `jasmine.json` scoped to
   the mounted `tests/backend` / `tests/frontend`; the frontend one wires the
   baked `loader.js` (`--import`) and `dom.js` (`helpers`). Baked `c8` config with
   `include: ["src/**/*.js", "src/**/*.jsx"]`. Backend and frontend run as two
   separate processes.
3. **`dockerfiles/navi-hey-test/`** — `FROM darthjee/node` (reusing the
   `yarn_builder.sh` cache-warm pattern), baking Navi `source/` + `frontend/`
   with full devDependencies, `frontend/spec/support/*`, the `navi-hey/testing`
   doubles, the two `jasmine.json` + `c8` config, and the
   `/navi/node_modules/navi-hey` symlink. Small entrypoint dispatching
   `backend` / `frontend` / `all` / `lint` / `sh`, default `all`, with an
   `--coverage` pass-through. Author bind-mounts `src/` and `tests/`.
   Whether to first extract a shared `dev_navi_hey-base` layer is left to
   implementation (SPEC-6 §6 — desirable, not required).
4. **Self-test — full CircleCI.** A PR-time job that builds `navi-hey-test` and
   runs `examples/navi-orders-extension/tests/` through it (backend + frontend),
   separate from the existing `smoke-extensions` composed-stack job.
5. **Release — full CircleCI.** A version-tag-gated
   `build-and-release-navi-hey-test` job (its own `:<git-tag>` + `:latest` tags
   and the `-arm64` variant set) that `requires` the existing
   `jasmine` / `jasmine-frontend` / `checks` / `checks-frontend` jobs and gates
   `npm-publish` / `build-and-release` alongside `smoke-extensions`, parallel to
   Tent's `build-and-release-tent-test-*`. A `make` target builds it locally.
6. **Example re-alignment (Option A).** Convert `examples/navi-orders-extension/`
   to consume the image: delete `spec/support/` (the four copied support files,
   the local `navi-hey` `file:` stub, and `spec/support/jasmine.json`) and the
   test-only devDependencies; switch `tests/frontend/orders_page_spec.jsx` to
   `import { useContainer } from 'navi-hey/testing/dom.js'`; `npm test` becomes
   `docker compose run --rm extension_tests` with a compose service mounting
   `src/` and `tests/`. The example no longer runs its suite without Docker
   (SPEC-6 §7 accepts this).
7. **Docs.** Fold the durable harness guidance into
   `docs/guides/navi/extending-navi.md` (replacing its "see the design doc"
   deferral); the transient SPEC-6 doc is removed later by CLEAN-1 (#807).

## Benefits

- Extension authors get a one-command Jasmine harness pinned to their exact Navi
  tag — no copied support files, no hand-stubbed `navi-hey`, no assembled
  toolchain.
- "What you test is what runs": the same `navi-hey/extension` /
  `navi-hey/testing` resolution and the same React instance as the runtime image.
- Hard isolation from Navi's own spec trees in both directions, with coverage
  scoped to the author's code.
- A copy-paste CI job for downstream projects, and a Navi-side job that keeps the
  harness honest against the worked example on every change.
- No new npm publish surface — the doubles ride in the image only, so `navi-hey`
  package consumers are unaffected.

## Agents

docker, engine, frontend, docs, guide.

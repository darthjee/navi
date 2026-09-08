# Plan: SPEC: frontend extra-route extension mechanism

Issue: [798-spec-frontend-extra-route-extension-mechanism.md](../issues/798-spec-frontend-extra-route-extension-mechanism.md)

## Overview

Specification/documentation issue in the **extension track** of #794. The
deliverable is prose only: append a `## Frontend` section to the existing
`docs/agents/future/extension-architecture.md` (created by SPEC-3 / #797, merged),
built on SPEC-3's **Shared contract**. No production code, no tests. The document
is transient — CLEAN-1 (#807) deletes it, folding durable parts into
`docs/agents/frontend.md`.

All design decisions are settled on the issue (see its `## Solution`); this plan
captures them precisely against the current frontend build/serve setup so IMPL-4
(#804) can be built and tested with no further decisions.

## Context

### Settled decisions (from the issue)

- **Strategy: runtime registration.** Operator mounts *pre-built* ESM bundles
  under `NAVI_EXTENSIONS_DIR/frontend/`; the running SPA discovers and lazy-loads
  them. No SPA rebuild, no frontend toolchain in the derived image.
- **`frontend/` layout: flat.** Each `frontend/*.js` is a pre-built ESM bundle
  that default-exports an array of `{ path, text, component }` descriptors
  (`component` a React component). Optional sibling `*.css`. Non-recursive in v1.
- **Discovery: Navi-generated manifest.** New handler serves
  `GET /extensions/frontend.json` — enumerates `frontend/*.js`, returns
  `{ bundles: [{ src: '/extensions/frontend/<name>.js' }] }`. Returns
  `{ bundles: [] }` when `NAVI_EXTENSIONS_ENABLED` is falsey — this is how the
  server-side enable flag reaches the static SPA (resolves SPEC-3's open item).
- **Asset serving: dedicated guarded handler.** `GET /extensions/frontend/*path`
  → handler modeled on `AssetsHandler` (`path.resolve` +
  `new PathValidator(frontendDir).validate` + `res.sendFile`) reading straight
  from `NAVI_EXTENSIONS_DIR/frontend/`. No copy into `source/static/`.
- **Router wiring.** `main.jsx` (or a bootstrap module) fetches
  `/extensions/frontend.json` before first render; for each bundle
  `await import(src)`, read `default`, append `<Route path={path}
  element={<Component/>} />` after the stock routes. Fetch failure or `[]` →
  app renders exactly as today.
- **Menu integration.** Extension descriptors' `{ path, text }` merged into the
  #796 menu response *after* the menu-file entries, per #796's file-order rules;
  operator edits nothing, can still hide one via #796 `hidden`.
- **Single React instance.** `index.html` import map maps `react` / `react-dom` /
  `react-router-dom` to the host's bundled copies; extension bundles built with
  those as externals. IMPL-4 finalises the exact map; the fixed constraint is
  "exactly one React instance, provided by the host".
- **Failure mode.** Manifest fetch error / bad JSON → no extensions. Bundle fails
  `import()` or `default` is not an array of valid descriptors → warn, skip,
  continue. Route component throws at render → error boundary around the extension
  `<Route>` subtree; stock UI unaffected.

### Current frontend build/serve setup (verified this session)

- `frontend/` is a Vite + React 19 SPA; `frontend/src/main.jsx` renders a
  `HashRouter` with a literal `<Routes>` list; `frontend/vite.config.js` →
  `outDir: dist`.
- `scripts/ci/build-frontend.sh`: `yarn build` then
  `cp -r frontend/dist/. source/static/` — runs at **npm-publish / image-build
  time**, not in the container.
- Production image `dockerfiles/production_navi_hey/Dockerfile` is
  `npm install -g navi-hey@<version>` — **no frontend source, no Vite** in the
  running image; `source/static/` is pre-built inside the package.
- `source/lib/server/Router.js` — SPA serving: `express.static(staticDir)`
  (`staticDir = <pkg>/source/static`), `GET /assets/*path` via `AssetsHandler`,
  catch-all `IndexHandler` → `source/static/index.html`. Extra routes are
  registered in `Router.build()` before `express.static` / catch-all.
- `source/lib/server/handlers/AssetsHandler.js` — the exact precedent for the new
  asset handler: `[].concat(req.params.path).join(path.sep)` → `path.resolve` →
  `PathValidator.validate` → `res.sendFile`.
- `source/lib/server/PathValidator.js` — `new PathValidator(baseDir)`;
  `validate()` throws `ForbiddenError` (→ 403 via `RouteRegister`).
- SPEC-3's file `docs/agents/future/extension-architecture.md` already exists with
  `## Shared contract` and `## Backend`; its intro and `## Cross-references`
  already anticipate SPEC-4 appending `## Frontend`.

### Cross-track coupling

- **#796** (menu track, merged) provides the menu endpoint whose response the
  extension `{ path, text }` entries are merged into. Reconcile the exact endpoint
  name/shape with what #796 actually shipped when writing the Menu integration
  subsection.
- **IMPL-4 (#804)** implements this section and spans two areas: `frontend/`
  (bootstrap fetch, router wiring, error boundary, `index.html` import map) and
  `source/` (two new handlers + routes wired into `Router.build()`).
- **SPEC-5 (#799)** documents the derived-image / mount / env story for users and
  must reuse the names fixed here.

## Implementation Steps

### Step 1 — Write the `## Frontend` section

Append `## Frontend` to `docs/agents/future/extension-architecture.md`, after
`## Backend` and before `## Cross-references`. One subsection per issue bullet,
each ending on the settled recommendation:

- **Strategy decision** — runtime registration; give the trade-off vs. build-time
  rebuild and the rationale (published package has no toolchain; keeps the
  derived-image story symmetric with the backend).
- **`frontend/` subtree layout** — flat `frontend/*.js` pre-built ESM bundles,
  optional sibling `*.css`, non-recursive in v1; the bundle's default export is
  the descriptor array. Give a minimal example bundle
  (`export default [{ path: '/ext/reports', text: 'Reports', component: Reports }]`).
- **Discovery** — `GET /extensions/frontend.json`; manifest shape
  `{ bundles: [{ src }] }`; enumerated from `frontend/*.js`, lexicographically
  sorted (mirror the backend's deterministic order); `{ bundles: [] }` when
  disabled or the subtree is absent.
- **Router wiring** — the boot sequence: bootstrap module fetches the manifest →
  `await import(src)` per bundle → validate `default` → append
  `<Route path element={<Component/>}>` inside the existing `<Routes>` after the
  stock routes → then `createRoot(...).render(...)`. State that a failed/empty
  fetch renders the current app unchanged, and that `HashRouter` means extension
  paths are `#/...` like the stock ones.
- **Menu integration** — extension `{ path, text }` pairs POSTed... no: *merged
  server-side or client-side?* Recommend the SPA passes discovered entries to the
  menu component, appended after the #796 menu-endpoint entries, honouring #796
  ordering and `hidden`. Reconcile with #796's actual client/endpoint shape.
- **Asset serving** — `GET /extensions/frontend/*path` handler modeled on
  `AssetsHandler`, `baseDir = path.join(NAVI_EXTENSIONS_DIR, 'frontend')`,
  `PathValidator`-guarded, `res.sendFile`, correct `Content-Type` for `.js` /
  `.css`. Registered in `Router.build()` before `express.static` / catch-all.
  Returns 404 when extensions disabled or the file is absent, 403 on traversal.
- **Enable flag on a static SPA** — spell out that the SPA is unconditional and
  always fetches the manifest; the server gates by returning an empty bundle list
  when `NAVI_EXTENSIONS_ENABLED` is falsey. No env in the SPA, no build-time
  branch. This is the explicit resolution of SPEC-3's open item — say so.
- **Single React instance** — the constraint (one React, host-provided) is fixed;
  recommend an `index.html` import map + extension bundles built with `react`,
  `react-dom`, `react-router-dom` as externals; note `React.lazy` may be used for
  code-splitting the extension components. Exact import-map contents are IMPL-4's.
- **Failure mode** — enumerate: manifest fetch/JSON error → no extensions; bundle
  `import()` throw or bad `default` → `console.warn` + skip + continue; descriptor
  missing `path`/`component` or `path` not starting with `/` → skip that
  descriptor + warn; route component throws → error boundary wrapping the
  extension routes, rest of the app unaffected. No white screen in any case.
- **Build/serve story** — end-to-end for the downstream developer: build your
  bundle externalising React; put `*.js`/`*.css` in `./my-ext/frontend/`; mount
  `./my-ext:/navi/extensions`; set `NAVI_EXTENSIONS_ENABLED=true`; start the stock
  `darthjee/navi` image; the dashboard shows your route + menu entry. No derived
  image required for the frontend (only if backend routes are also added — same
  volume). Feeds SPEC-5 (#799).

Every subsection ends on a single concrete recommendation, not an options list
(issue acceptance criterion).

### Step 2 — Reconcile and finish

- Update the file intro: the "This file owns two things" / "SPEC-4 appends a
  `## Frontend` section" lines now describe something present — adjust tense and
  add `## Frontend` to any in-file navigation.
- Update `## Cross-references`: SPEC-4 (#798) line from "will append" to "adds the
  `## Frontend` section (below)"; keep the IMPL-4 (#804) pointer.
- Reconcile the two new server routes with the backend section's "extra routes
  registered before `express.static` / catch-all" rule and with
  `NAVI_EXTENSIONS_DIR` / `ExtensionsEnv` from SPEC-3 — the frontend handlers read
  the same `ExtensionsEnv`, not a second env mechanism.
- Reconcile Menu integration wording with the menu endpoint/client that #796
  actually shipped (read the merged `docs/agents/frontend.md` / the #796 code).
- Verify acceptance criteria: `## Frontend` covers every bullet; shared contract
  unchanged and consistent (folder layout, env names, volume target); concrete
  build-time-vs-runtime recommendation with rationale; IMPL-4 has no open
  decisions.

## Files to Change

- `docs/agents/future/extension-architecture.md` — append the `## Frontend`
  section; touch the intro and `## Cross-references` for tense/nav. No other
  files.

## Notes

- Pure documentation under `docs/agents/future/`. No code, no specs, no build. No
  CI job covers `docs/**` (CI is per-code-folder lint + jasmine), so there are no
  CI checks for this issue.
- No agent split: authoring a `docs/agents/future/` architecture doc is the
  architect's scope; no `.claude/agents` specialist owns that path. frontend /
  docker input is advisory and already captured in the settled decisions.
- IMPL-4 (#804), which this feeds, will span both `frontend/` and `source/` — note
  that in the section so the implementation plan splits correctly later.
- Keep the section self-contained for CLEAN-1 (#807) to move into
  `docs/agents/frontend.md` mechanically.
- Do not expand scope: no build-time rebuild path, no SSR, no npm-install for
  extension bundles, no per-extension permissioning, no recursive `frontend/`.
  New concerns → comment on #794.

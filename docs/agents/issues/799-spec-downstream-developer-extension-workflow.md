# Issue: SPEC: downstream-developer extension workflow

## Description

Part of #794 (**extension track**) — this is **SPEC-5**. **Spec issue only**: no
production code (documentation files are the deliverable).

Two deliverables:

1. `docs/agents/future/downstream-extension-workflow.md` — the transient
   architecture/design document describing the end-to-end workflow for building
   a product *on top of* the stock Navi image without forking it. Deleted by
   **CLEAN-1 (#807)** once the feature ships.
2. A **user-facing guide** under `docs/guides/navi/` (e.g.
   `docs/guides/navi/extending-navi.md`, exact name the doc's call) — permanent
   documentation carrying the parts SPEC-3/SPEC-4 explicitly deferred to "the
   SPEC-5 user guide": the security warning, the "extensions are fixed for the
   process lifetime" reload limitation, and the copy-pasteable `vite build --lib`
   / Rollup config with `react` / `react-dom` / `react-router-dom` as externals.

It feeds **IMPL-5 (#805)** ("wire up the downstream extension workflow end to
end"), which turns the worked example into a real fixture at
`spec/fixtures/extensions/`.

Depends on **SPEC-3 (#797)** and **SPEC-4 (#798)**, whose merged output is
`docs/agents/future/extension-architecture.md` — the single source of truth for
the env vars (`NAVI_EXTENSIONS_ENABLED`, `NAVI_EXTENSIONS_DIR`), the mounted
`/navi/extensions/{backend,frontend}` layout, the backend/frontend route
descriptor shapes, the served route names (`/extensions/frontend.json`,
`/extensions/frontend/*`), and the "build React as external" constraint. SPEC-5
**reuses all of these unchanged** and must not contradict them.

## Problem

SPEC-3 (#797) and SPEC-4 (#798) fixed the contract on the *container* side —
what Navi scans, loads, and serves from the mounted folder, and the shape of
each descriptor. What no document yet covers is the **downstream developer's own
project**, as one story:

- the source-tree layout of the extension project itself (handlers, pages,
  extra-routes config, menu config, tests, build config) — SPEC-3/SPEC-4 only
  describe the *built artifact* layout under `/navi/extensions`;
- the build tooling that produces those artifacts, in particular the
  `vite build --lib` / Rollup config with React/React-DOM/React-Router-DOM as
  externals (SPEC-4 mandates it but leaves the snippet to "the SPEC-5 user
  guide");
- how a backend route, a frontend page, and a menu entry compose into **one**
  deliverable and one `docker-compose.yml` / `docker_volumes/` wiring;
- what a downstream developer must re-check when bumping the base Navi version
  (import-map React version, handler base-class import path, route-name
  collisions, the reload limitation).

Additionally, the security warning, the reload limitation, and the external-React
build snippet that SPEC-3/SPEC-4 defer to "the SPEC-5 user guide" currently have
**no permanent home** — the `docs/agents/future/` doc is deleted by CLEAN-1
(#807).

IMPL-5 (#805) needs a single buildable spec plus a concrete worked example it
can lift directly into a fixture.

## Expected Behavior — the documents must cover

**`docs/agents/future/downstream-extension-workflow.md`:**

- **Folder layout** — the full extension *project* structure a downstream
  developer creates (backend handlers, frontend pages/components, extra-routes
  config, menu config, tests, build config), and how it maps onto the mounted
  `/navi/extensions/{backend,frontend}` layout fixed by SPEC-3/SPEC-4.
- **Registration contracts** — the exact interface each extension module must
  export: the backend route-descriptor array (`{ method, path, handler }`, handler
  a `RequestHandler` subclass) and the frontend bundle default export
  (`{ path, text, component }`), quoting SPEC-3/SPEC-4 rather than re-deciding.
  Pin the canonical import path for the backend handler base class.
- **Image composition** — how the downstream image/deployment is built:
  `FROM darthjee/navi:<tag>` when a derived image is wanted, what to `COPY` vs.
  bind-mount, when a rebuild is required (per SPEC-4: **not** for the frontend —
  pre-built ESM bundles are mounted, the SPA is never rebuilt), and the
  `docker-compose.yml` / volume wiring using the existing `docker_volumes/`
  convention.
- **Configuration** — which env vars / config paths point Navi at the mounted
  extension folder and enable loading (`NAVI_EXTENSIONS_ENABLED`,
  `NAVI_EXTENSIONS_DIR`; `NAVI_MENU` / `-m` for the menu file).
- **Worked example** — a minimal end-to-end example: one backend route + one
  frontend page + one menu entry, plus **one backend test and one frontend
  test** (consistent with SPEC-6 / #800's direction), concrete enough that
  IMPL-5 (#805) can turn it directly into the `spec/fixtures/extensions/`
  fixture. Includes the extension project's Vite lib build config and the
  resulting mounted-folder tree.
- **Upgrade story** — the checklist a downstream developer runs when bumping the
  base Navi version: import-map React/React-Router version alignment, handler
  base-class import path stability, stock-vs-extension route-name collisions,
  and re-running the extension's own tests against the new image.

**User-facing guide (`docs/guides/navi/…`):**

- The security warning ("enabling extensions runs arbitrary JavaScript you mount
  into the container, in the same process as Navi, with no isolation").
- The reload limitation ("extensions are fixed for the process lifetime;
  changing them requires a container restart; `PATCH /engine/reload` does not
  affect them").
- The copy-pasteable external-React `vite build --lib` / Rollup config snippet.
- A condensed version of the worked example aimed at an operator/developer
  audience rather than an implementer.

## Solution — document outline

**`docs/agents/future/downstream-extension-workflow.md`**, structured roughly:

1. **Scope & relationship to SPEC-3/SPEC-4** — this doc is the downstream
   developer's view; the container-side contract lives in
   `extension-architecture.md` and is referenced, not copied.
2. **Extension project layout** — annotated tree of the developer's own repo
   (`backend/`, `frontend/` sources + components, build config, `tests/`,
   `menu.yml`).
3. **Backend extension** — the descriptor contract, a handler example, the
   canonical base-class import path, the build (none — plain ESM).
4. **Frontend extension** — the descriptor contract, a page/component example,
   the `vite build --lib` config with React/React-DOM/React-Router-DOM as
   externals, the optional sibling CSS.
5. **Menu entry** — adding a `config/menu.yml` entry for the new route
   (per SPEC-1 #795), and the auto-append behaviour from SPEC-4.
6. **Image & compose** — derived-image vs. pure bind-mount, `docker_volumes/`
   wiring, when a rebuild is / isn't needed.
7. **Worked example** — the full 1-route + 1-page + 1-menu-entry example plus
   one backend + one frontend test, mapped onto `spec/fixtures/extensions/` as
   IMPL-5 (#805) will build it.
8. **Upgrade checklist** — the base-Navi-bump steps.
9. **Deferred / out of scope** — the full downstream test *setup* is SPEC-6
   (#800); this doc only shows the two example tests and defers the harness.

**User-facing guide** — new page under `docs/guides/navi/` (linked from the
guides index / `how_to_use_navi.md`), covering the security warning, the reload
limitation, the external-React build snippet, and an operator-facing condensed
walkthrough.

Open coordination point: the two example tests in deliverable 1 must stay
consistent with SPEC-6 (#800) — if SPEC-6 lands first its test conventions win;
otherwise SPEC-5's examples set the initial shape and SPEC-6 aligns to them.

## Benefits / Acceptance criteria

- [ ] `docs/agents/future/downstream-extension-workflow.md` exists and covers
      every bullet under *Expected Behavior* (deliverable 1).
- [ ] A user-facing guide page exists under `docs/guides/navi/` carrying the
      security warning, the reload limitation, and the copy-pasteable
      external-React build snippet, and is linked from the guides index.
- [ ] The worked example is concrete enough to implement directly in IMPL-5
      (#805) — descriptor exports, Vite build config, mounted tree, compose
      snippet, one backend + one frontend test — targeting
      `spec/fixtures/extensions/`.
- [ ] No contradictions with the SPEC-3 / SPEC-4 shared contract in
      `extension-architecture.md` (env vars, folder layout, route names,
      descriptor shapes, "React as external").
- [ ] The canonical backend handler base-class import path is stated once and
      used consistently across both documents.

**Dependencies:** SPEC-3 (#797), SPEC-4 (#798). Feeds IMPL-5 (#805). Coordinates
with SPEC-6 (#800) on the two example tests. `future/` doc deleted by CLEAN-1
(#807); the `docs/guides/navi/` page is permanent.

**Agents:** architect (coordination + `docs/agents/future/` doc), with **docs**
(the `docs/guides/navi/` guide), **docker** (image/compose wiring), and **dev**
(worked-example shape) input.

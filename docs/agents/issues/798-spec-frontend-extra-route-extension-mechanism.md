# Issue: SPEC: frontend extra-route extension mechanism

## Description

Spec issue — part of #794, **extension track**. Appends a `## Frontend` section to
the existing `docs/agents/future/extension-architecture.md` (created by SPEC-3 /
#797, already merged). No production code. Removed by CLEAN-1 (#807) once the
feature ships.

SPEC-3's **Shared contract** section is fixed and consumed verbatim here:

- Env only, no YAML key: `NAVI_EXTENSIONS_ENABLED` (truthy = `1|true|yes|on`,
  default off) and `NAVI_EXTENSIONS_DIR` (default `/navi/extensions`).
- Mounted volume at `NAVI_EXTENSIONS_DIR` with reserved subtrees `backend/` and
  `frontend/`. `frontend/` layout is explicitly **this issue's call**.
- SPEC-3 left one open item for this issue: *"the backend reads the env at
  container runtime; the frontend is a Vite build produced into `source/static/`
  before the container runs — SPEC-4 must state how the `frontend/` subtree and
  the enable flag are surfaced at build/serve time."*

## Current frontend architecture (context for the spec)

- `frontend/` is a Vite + React 19 SPA. `frontend/src/main.jsx` renders a
  `HashRouter` with a literal `<Routes>` list; pages live in
  `frontend/src/components/pages/`.
- `frontend/vite.config.js` builds to `frontend/dist`.
  `scripts/ci/build-frontend.sh` runs `yarn build` then
  `cp -r frontend/dist/. source/static/`. This happens **at npm-publish / image
  build time**, not in the running container.
- The **production image does not ship the frontend source or the Vite
  toolchain**: `dockerfiles/production_navi_hey/Dockerfile` is just
  `npm install -g navi-hey@<version>` — the package already contains a built
  `source/static/`.
- `source/lib/server/Router.js` serves the SPA: `express.static(staticDir)`
  (`staticDir = <pkg>/source/static`), `GET /assets/*path` via `AssetsHandler`
  (path-traversal-guarded by `PathValidator`, `sendFile`), and a catch-all
  `IndexHandler` returning `source/static/index.html`.
- `source/lib/server/handlers/AssetsHandler.js` is the precedent for serving
  files from a directory with `path.resolve` + `PathValidator.validate` +
  `res.sendFile`.
- There is **no runtime module loading** in the SPA today.

## Problem

A product built on the stock Navi image cannot add its own dashboard pages/routes
without forking. The backend half (#797/#803) is settled, but the frontend has a
harder constraint: the SPA is a pre-built bundle shipped inside the npm package,
and the image carries no build toolchain, so "rebuild the SPA with the
extension's source" is not a lightweight operation for a downstream developer.

Undefined today:

- Whether extensions are added by rebuilding the SPA or by the running SPA
  loading pre-built bundles at runtime.
- The `frontend/` subtree layout and the per-extension entry-point convention.
- How an extra route is injected into `main.jsx`'s route table, and how it gets a
  `{ route, text }` menu entry (menu track #795/#796).
- How extension JS/CSS is served and kept path-traversal-safe.
- How the server-side `NAVI_EXTENSIONS_ENABLED` flag reaches a static SPA.
- What happens when a bundle fails to load or declares a malformed route.
- The single-React-instance constraint for externally built React bundles.

IMPL-4 (#804) is blocked until these are decided.

## Expected Behavior

Deliverable: a `## Frontend` section appended to
`docs/agents/future/extension-architecture.md`, consistent with the Shared
contract, covering:

- **Strategy decision** — build-time SPA rebuild vs. runtime registration of
  pre-built bundles. State trade-offs; land on one with rationale (the published
  package has no toolchain — see Description).
- **`frontend/` subtree layout** — what an operator puts under
  `NAVI_EXTENSIONS_DIR/frontend/`: pre-built ESM bundle(s), any CSS, and how each
  bundle declares its routes and its `{ route, text }` menu entry. Recursive or
  flat; entry-point convention.
- **Discovery** — how the SPA learns what extensions exist: a Navi-generated
  manifest served at a fixed URL vs. a fixed entry file the SPA imports. Include
  the manifest shape if chosen.
- **Router wiring** — how `main.jsx` merges extension routes into `<Routes>`
  (fetch manifest → `import()` each bundle → `React.lazy` / component →
  `<Route>`), and where in the boot sequence this happens so the app still
  renders if discovery returns nothing.
- **Menu integration** — how an extension route becomes a menu entry: reconcile
  with the menu config file from #795/#796 (extension-declared entries merged into
  the menu response vs. operator adding them to the menu file).
- **Asset serving** — how `frontend/` files are served: a dedicated
  `PathValidator`-guarded handler reading straight from `NAVI_EXTENSIONS_DIR/frontend/`
  (like `AssetsHandler`), vs. a boot-time copy into `source/static/`. Path-
  traversal safety either way.
- **Enable flag on a static SPA** — resolve SPEC-3's open item: the SPA cannot
  read env, so state how `NAVI_EXTENSIONS_ENABLED` gates the frontend (e.g. the
  discovery endpoint returns empty when disabled; the SPA is unconditional).
- **Single React instance** — extension bundles must not bundle their own
  `react` / `react-dom` / `react-router-dom`; state the mechanism (import map in
  `index.html`, host-exposed globals, or build-as-externals) or explicitly hand
  the exact choice to IMPL-4 with the constraint fixed.
- **Failure mode** — bundle fails to `import()`, exports the wrong shape, a route
  component throws, or the manifest is malformed: never white-screen; skip + warn;
  error boundary for a throwing page.
- **Build/serve story** — concrete end-to-end steps for the chosen strategy and
  how it composes with the stock image (feeds SPEC-5 / #799).

Every point lands on a concrete recommendation, not an options list.

## Solution

Positions to document (settled in discussion on this issue):

- **Strategy: runtime registration.** The operator mounts *pre-built* ESM
  bundle(s) under `NAVI_EXTENSIONS_DIR/frontend/`; the running SPA discovers and
  lazy-loads them. No SPA rebuild, no toolchain in the derived image — consistent
  with SPEC-3's "mount code, opt-in via env, import only what the image ships plus
  your own bundled `.js`".
- **`frontend/` layout: flat.** Each `frontend/*.js` is a pre-built ESM bundle
  that default-exports an array of `{ path, text, component }` descriptors
  (`component` a React component). Optional sibling `*.css`. Non-recursive in v1,
  matching `backend/`.
- **Discovery: Navi-generated manifest.** A new handler serves
  `GET /extensions/frontend.json` — enumerates `frontend/*.js`, returns
  `{ bundles: [{ src: '/extensions/frontend/<name>.js' }] }` (routes are read from
  the bundle itself, folder is source of truth, mirroring the backend). Returns
  `{ bundles: [] }` when `NAVI_EXTENSIONS_ENABLED` is falsey — this is how the
  enable flag reaches the static SPA.
- **Asset serving: dedicated guarded handler.** `GET /extensions/frontend/*path`
  → a handler modeled on `AssetsHandler` (`path.resolve` +
  `new PathValidator(frontendDir).validate` + `res.sendFile`), reading straight
  from `NAVI_EXTENSIONS_DIR/frontend/`. No copy into `source/static/` (the
  install dir may be read-only).
- **Router wiring.** `main.jsx` (or a small bootstrap module) fetches
  `/extensions/frontend.json` before first render; for each bundle,
  `await import(src)`, read `default`, wrap each descriptor as
  `<Route path={path} element={<Component/>} />` appended after the stock routes.
  If the fetch fails or returns `[]`, the app renders exactly as today.
- **Menu integration.** Extension descriptors' `{ path, text }` are merged into
  the menu response (the #796 menu endpoint) *after* the menu-file entries,
  respecting the file-order rules from #796. The operator does not have to edit
  the menu file for extension routes; they can still hide one via #796's
  `hidden`.
- **Single React instance.** `index.html` gets an import map mapping `react`,
  `react-dom`, `react-router-dom` to the host's already-bundled copies; extension
  bundles are built with those as externals. IMPL-4 finalises the exact map;
  the fixed constraint is "exactly one React instance, provided by the host".
- **Failure mode.** Manifest fetch error / malformed JSON → treat as no
  extensions. A bundle that fails to `import()` or whose `default` is not an array
  of valid descriptors → `console.warn`, skip that bundle, continue. A route whose
  component throws at render → caught by an error boundary around the extension
  `<Route>` subtree, stock UI unaffected.

## Benefits

- IMPL-4 (#804) gets one settled strategy, a bundle contract, a discovery
  endpoint, an asset route, and a failure policy — no open decisions.
- The derived-image story stays as light as SPEC-3's backend story: mount a
  volume, set one env var, no frontend toolchain, no SPA rebuild.
- Resolves SPEC-3's explicit open item (enable flag vs. static SPA) with a
  server-side gate, keeping the SPA unconditional and simple.
- Reuses existing precedents (`AssetsHandler` + `PathValidator` for serving,
  `React.lazy` for code-splitting, the #796 menu endpoint for entries) instead of
  new machinery.
- Keeps the frontend and backend contracts symmetric (flat folder, self-declaring
  modules, boot/serve-time discovery, skip-and-warn), so SPEC-5 (#799) documents
  one mental model.

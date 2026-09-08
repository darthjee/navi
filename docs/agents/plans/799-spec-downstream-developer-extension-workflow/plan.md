# Plan: SPEC: downstream-developer extension workflow

Issue: [799-spec-downstream-developer-extension-workflow.md](../../issues/799-spec-downstream-developer-extension-workflow.md)

## Overview

SPEC-5 of the #794 extension track. No production code — the deliverables are two
documentation files. The **architect** authors the transient design document
`docs/agents/future/downstream-extension-workflow.md` (deleted by CLEAN-1 / #807),
covering the downstream developer's own project: source-tree layout, backend and
frontend registration contracts, `FROM darthjee/navi:<tag>` image composition and
`docker_volumes/` wiring, configuration, a full worked example (one backend route
+ one frontend page + one menu entry + one backend test + one frontend test)
targeting `spec/fixtures/extensions/` for IMPL-5 (#805), and a base-Navi-bump
upgrade checklist. The **docs** agent adds the permanent user-facing guide
`docs/guides/navi/extending-navi.md` — the parts SPEC-3/SPEC-4 deferred to "the
SPEC-5 user guide": the security warning, the process-lifetime reload limitation,
and the copy-pasteable external-React Vite build snippet — and links it from the
guides index. Both documents reuse the SPEC-3/SPEC-4 shared contract in
`docs/agents/future/extension-architecture.md` unchanged.

## Agents involved

- [architect](architect.md) — `docs/agents/future/downstream-extension-workflow.md` and sibling cross-references
- [docs](docs.md) — `docs/guides/navi/extending-navi.md` and the guides index link

## Shared contracts

Everything below is fixed by SPEC-1/#795 (menu), SPEC-3/#797 (backend) and
SPEC-4/#798 (frontend) in `docs/agents/future/extension-architecture.md` and
`docs/agents/future/menu-configuration.md`. Both plan files reuse these **verbatim**
and neither document may redefine them.

- **Env / config surface**
  - `NAVI_EXTENSIONS_ENABLED` — truthy (`1`/`true`/`yes`/`on`) to load anything; unset/empty/falsey ⇒ mechanism inert.
  - `NAVI_EXTENSIONS_DIR` — absolute container path to the mounted folder; default `/navi/extensions`.
  - `NAVI_MENU` / `-m` / `--menu` — menu file path; default `config/menu.yml`.
- **Mounted-folder layout** — single volume at `NAVI_EXTENSIONS_DIR`, two reserved
  flat, non-recursive subtrees: `backend/` (ESM `*.js` modules) and `frontend/`
  (pre-built ESM bundles, optional sibling `<name>.css`). Load/enumeration order is
  the lexicographic filename sort. Either subtree may be absent (info log, not an
  error).
- **Backend route descriptor** — each `backend/*.js` module default-exports (or
  named-exports `routes`) an array of `{ method, path, handler }`:
  - `method` — `GET` | `PATCH` | `POST` (case-insensitive).
  - `path` — non-empty, starts with `/`, no whitespace; Express path syntax allowed.
  - `handler` — a `RequestHandler` subclass (class, not instance); instantiated
    per request as `new handler(req, res)`. `GET` handlers run synchronously;
    `PATCH`/`POST` `handle()` is awaited. `express.json()` body parsing already
    applied. Throwing `ConflictError`/`ForbiddenError`/`NotFoundError` maps to
    409/403/404; anything else ⇒ 500.
  - Extras are **public by default**; wiring a token into an extension
    `SecuredRequestHandler` is deferred by SPEC-3.
- **Frontend bundle descriptor** — each `frontend/*.js` bundle default-exports an
  array of `{ path, text, component }`:
  - `path` — non-empty, starts with `/`, no whitespace; becomes `<Route>` under the
    existing `HashRouter` (URL `#<path>`).
  - `text` — non-empty; the menu label (auto-appended after menu-file entries).
  - `component` — a React component (may be `React.lazy`).
  - Bundles are built with `react`, `react-dom`, `react-router-dom` as **externals**
    (import map in `frontend/index.html` provides the single shared instance).
- **Served routes** (added by IMPL-4 / #804) — `GET /extensions/frontend.json`
  (manifest; `{ "bundles": [] }` when disabled), `GET /extensions/frontend/*path`
  (asset serving; 404 when disabled).
- **Reload limitation** — extensions are fixed for the process lifetime;
  `PATCH /engine/reload` does not re-scan; changing extension code needs a
  container restart.
- **Security posture** — loading `backend/*.js` runs arbitrary code in the Navi
  process with full Node privileges, no sandbox; the opt-in flag plus the
  operator-controlled volume are the whole trust model.

### Contract items SPEC-5 must *settle* (not yet fixed by SPEC-3/SPEC-4)

- **Canonical backend handler base-class import specifier inside the production
  image.** `extension-architecture.md` currently shows
  `import { RequestHandler } from '/home/node/app/lib/common/server/RequestHandler.js'`,
  which is the dev-container layout. The production image installs the package with
  `npm install -g navi-hey@<version>` (see
  `dockerfiles/production_navi_hey/Dockerfile`), so the runtime location of the
  package's `lib/` is the global `node_modules` path, not `/home/node/app/lib/`.
  SPEC-5 must state one stable specifier (a documented absolute path, a bare
  `navi-hey/...` subpath export, or an import-map/alias entry) and both documents
  must use it identically. If the chosen answer needs a package change (e.g. an
  `exports` map), record it as a follow-up for IMPL-5 (#805) rather than
  re-specifying it here.
- **The one canonical worked example** — route path(s), file names, component
  name, menu label, and the two test file names — authored in `architect.md`'s
  document and condensed in `docs.md`'s guide with identical identifiers, all
  consistent with the `spec/fixtures/extensions/` tree IMPL-5 (#805) will build.
- **The external-React Vite build snippet** — its permanent home is the
  `docs/guides/navi/` guide (docs); the `future/` doc references it rather than
  duplicating it.
- **Test example vs. SPEC-6 (#800)** — the two example tests must stay consistent
  with SPEC-6's downstream Jasmine test setup: if SPEC-6 lands first its
  conventions win; otherwise SPEC-5's examples set the initial shape and SPEC-6
  aligns. The full harness/isolation story is SPEC-6's, not SPEC-5's.

## Notes

- Documentation-only change. No applicable CI job (`.circleci/config.yml`'s
  `lint-and-report` is scoped to code paths, not `docs/`); nothing to run.
- `AGENTS.md` and `.claude/agents/architect.md` link the `docs/agents/future/`
  folder as a whole, not individual files — no index edit required there. The
  guides index (`docs/guides/how_to_use_navi.md`) *does* list files individually,
  so it gets a new entry (docs).
- Sequencing: the architect document is the source of truth for the settled
  contract items above; ideally authored first (or jointly), with the docs guide
  quoting its decisions. They can be written in parallel as long as the
  shared-contract identifiers agree.

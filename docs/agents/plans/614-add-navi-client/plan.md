# Plan: Add Navi client

Issue: [614-add-navi-client.md](../issues/614-add-navi-client.md)

## Overview

Add a new `clients/` top-level folder (one subfolder per supported language, starting with `clients/node/`) that publishes an npm package, `navi-hey-client`, wrapping Navi's token-secured `/api/*` HTTP namespace (`POST /api/config`, `POST /api/engine/start`, `POST /api/engine/stop`). The package exposes both a library entrypoint and a `navi-client` CLI command, follows the repo's existing JS/Jasmine/ESLint/jscpd conventions, and gets its own specialist agent (`navi-client`, scoped to `clients/node/`). `scripts/bump_version.sh` is extended to bump the app and the client independently.

No existing specialist agent (`engine`, `frontend`, `dev`) owns any part of this work — `source/`'s `/api/*` routes are consumed as-is, unmodified — so this plan is a single, unsplit implementation, executed by the architect. Part of the implementation is creating the `navi-client` agent itself; once it exists, it becomes the owner of `clients/node/` for future work.

## Context

- `source/lib/server/` already exposes `POST /api/config`, `POST /api/engine/start`, `POST /api/engine/stop` under a bearer-token-secured namespace (`Authorization: Bearer <web.api.token>`), documented in `docs/agents/web-server.md`'s "`/api` namespace" section. No changes to these routes are needed.
- `source/package.json` is the closest existing analog: `"type": "module"`, `"main": "index.js"`, `"bin": { "navi-hey": "bin/navi.js" }`, `"files": ["bin", "lib", "static"]`, and scripts `spec`/`test`/`coverage`/`lint`/`lint_fix`/`report`. `clients/node/package.json` should mirror this shape (with `"main"` pointing to a non-`index.js` file, e.g. `client.js`, and `"bin": { "navi-client": "bin/navi-client.js" }`).
- `source/lib/services/Client.js` shows the existing axios usage pattern (timeout, headers, `validateStatus: () => true`, explicit status check) — a reasonable reference for the new client's HTTP calls, though it doesn't need to be reused directly (different concerns: this is a config-driven resource fetcher, the new client is a thin `/api/*` caller).
- `source/README.md` is a separate, npm-facing README distinct from the root `README.md` (used as the `"readme"` field in `package.json` and included via `"files"` implicitly through npm's default README pickup). `clients/node/README.md` should follow the same split.
- `scripts/bump_version.sh` currently takes a single required `<version>` positional argument and unconditionally updates: root `README.md`'s Current Version/Next Release lines, `source/package.json`'s version, and `dockerfiles/demo_navi_hey/Dockerfile`'s `FROM darthjee/navi-hey:<version>` line.
- `scripts/check_tag_version.sh` (run by CircleCI's `check-version-tag` job) only checks `source/package.json` and root `README.md`'s Current Version against the git tag — this issue does not touch it, since client tagging/CI-publish is explicitly out of scope (deferred to a follow-up issue).
- `.claude/agents/{engine,frontend,dev}.md` show the specialist-agent file shape (YAML frontmatter `name`/`description`/`tools`, a "Your scope" section listing owned paths and an explicit "Do NOT touch..." boundary, a "Stack" section, and a "Commands" section with the Docker container name to run tests in). `.claude/agents/architect.md` has a "Specialist agents" table that must gain a `navi-client` row.
- `.circleci/config.yml` runs each package's lint/test as plain `yarn install` + npm-script CircleCI jobs (no Docker Compose in CI) — see `jasmine`/`checks` (for `source/`) and `jasmine-dev`/`checks-dev` (for `dev/app/`) for the pattern to mirror for `clients/node/`. The `npm-publish` job and tag-triggered release jobs are untouched by this issue (client publishing is a follow-up).

## Implementation Steps

### Step 1 — Scaffold `clients/node/`

Create the package skeleton:
- `clients/node/package.json` — name `navi-hey-client`, `"type": "module"`, `"main": "client.js"`, `"bin": { "navi-client": "bin/navi-client.js" }`, `"files": ["bin", "lib", "client.js"]`, scripts mirroring `source/package.json` (`spec`, `test`, `coverage`, `lint`, `lint_fix`, `report`), `axios` as the only runtime dependency, matching devDependencies to `source/package.json` for eslint/jasmine/c8/jscpd.
- `clients/node/client.js` — the library entrypoint, exporting functions/methods for `config(payload)`, `engineStart(payload)`, `engineStop()` (naming at implementer's discretion, but should read naturally as a JS API), each performing the corresponding `POST /api/*` call with `Authorization: Bearer <token>` and the base URL/token supplied by the caller (e.g. via a constructor/config object — no hidden global state).
- `clients/node/lib/` — supporting implementation (e.g. an internal HTTP helper), following `source/lib/`'s module-per-class convention.
- `clients/node/bin/navi-client.js` — CLI entrypoint (shebang `#!/usr/bin/env node`), parsing minimal arguments (base URL, token, and which `/api/*` action to invoke) and calling into `client.js`. Mirror `source/bin/navi.js`'s thin-entrypoint style (delegate logic to `lib`/`client.js`, don't implement logic inline).
- `clients/node/spec/` — Jasmine specs for `client.js`, the CLI, and any `lib/` modules, mirroring `source/spec/`'s structure.
- `clients/node/eslint.config.mjs` — reuse `source/eslint.config.mjs`'s rule set (drop the React-specific plugins/rules, which don't apply here).
- `clients/node/README.md` — npm-facing readme: what the package does, install (`npm install navi-hey-client`), and both library and CLI usage examples.

### Step 2 — Add the `navi-client` specialist agent

Create `.claude/agents/navi-client.md` following the shape of `.claude/agents/engine.md`/`frontend.md`/`dev.md`:
- Frontmatter: `name: navi-client`, a `description` stating it owns `clients/node/` (and, by extension, future `clients/<language>/` folders until they warrant their own agent — per the issue, each new language gets its own dedicated agent, so keep this description scoped to Node specifically), `tools: Read, Edit, Write, Bash`.
- "Your scope" section: everything under `clients/node/`; explicit "Do NOT touch" boundary for `source/`, `dev/`, `frontend/`, and other `clients/<language>/` folders.
- "Stack" section: Node.js, ESM, axios, Jasmine, c8, ESLint, JSCPD — same tooling list as `source/`.
- "Commands" section: how to run tests/lint locally (align with whatever Step 4 sets up — Docker Compose service if one is added, otherwise plain `cd clients/node && npm run coverage`/`npm run lint`/`npm run report`).

Update `.claude/agents/architect.md`'s "Specialist agents" table to add:
```
| `navi-client` | `clients/node/` — the Node.js client package (`navi-hey-client`) wrapping Navi's `/api/*` HTTP namespace |
```

### Step 3 — Update `scripts/bump_version.sh`

Change the argument handling to `bump_version.sh [app|client] [version]`:
- No arguments: target defaults to `app`, version omitted → auto-bump.
- One argument: if it matches `^(app|client)$`, treat it as the target with version omitted (auto-bump); otherwise treat it as a version string for the `app` target (preserves today's `bump_version.sh <version>` call shape).
- Two arguments: `<target> <version>`.
- When `[version]` is omitted, compute the next version by incrementing the *target's own current* patch version by 1 (reuse the existing `MAJOR.MINOR.$((PATCH + 1))` math against `app`'s current version from `source/package.json`, or `client`'s current version from `clients/node/package.json`, depending on target).
- `app` target: unchanged file edits (root `README.md` Current/Next Release badges, `source/package.json`, `dockerfiles/demo_navi_hey/Dockerfile`).
- `client` target: bump `clients/node/package.json`'s version, and add/update a client version line in root `README.md` (mirror the app's Current/Next Release badge style — exact heading/placement at implementer's discretion, e.g. directly below the app's badges).
- Keep the existing `echo "Bumped to $VERSION ..."` confirmation style, scoped per target.

### Step 4 — CI: lint/test jobs for `clients/node/`

In `.circleci/config.yml`, add two new jobs mirroring `jasmine-dev`/`checks-dev` (minus the `dev/app/lib/common` copy step, which is specific to that package):
- `jasmine-client`: `cd clients/node; yarn install` → `npm run coverage` → upload partial coverage to Codacy.
- `checks-client`: `cd clients/node; yarn install` → `npm run lint` → `npm run report`.

Add both to the `test-and-release` workflow (same `filters: tags: only: /.*/` as the other jasmine/checks jobs) and to `coverage-final`'s `requires` list.

Do **not** add a client entry to `npm-publish`, `check-version-tag`, or any tag-triggered job — publishing/tagging the client package is explicitly out of scope for this issue (see the issue's "Versioning & bump_version.sh" section).

### Step 5 — Documentation updates

- `docs/agents/folder-structure.md`: add a `clients/` section (mirroring the existing `dev/` subsection) documenting `clients/node/` and noting the folder is designed to hold one subfolder per supported client language.
- `AGENTS.md`: add a row to the documentation table for a new `docs/agents/client-node.md` (or similar) doc, following the pattern of the existing `dev-app.md`/`web-server.md`/`frontend.md` entries — package layout, API surface wrapped, CLI usage, testing, CI jobs.
- Create `docs/agents/client-node.md` with that content.
- Root `README.md`: add the client's Current Version line (from Step 3) — version info only, no install/usage docs (those live in `clients/node/README.md` per the issue).

## Files to Change

- `clients/node/package.json` — new package manifest
- `clients/node/client.js` — library entrypoint
- `clients/node/lib/**` — supporting implementation
- `clients/node/bin/navi-client.js` — CLI entrypoint
- `clients/node/spec/**` — Jasmine specs
- `clients/node/eslint.config.mjs` — lint config
- `clients/node/README.md` — npm-facing readme
- `.claude/agents/navi-client.md` — new specialist agent
- `.claude/agents/architect.md` — register `navi-client` in the specialist table
- `scripts/bump_version.sh` — target-aware, optional-version bump
- `.circleci/config.yml` — `jasmine-client`/`checks-client` jobs, workflow wiring
- `docs/agents/folder-structure.md` — document `clients/`
- `docs/agents/client-node.md` — new doc for the client package
- `AGENTS.md` — reference the new doc
- `README.md` — client Current Version line

## CI Checks

- `clients/node`: `npm run coverage` (CI job: `jasmine-client`, new)
- `clients/node`: `npm run lint` && `npm run report` (CI job: `checks-client`, new)
- Root-level changes (`bump_version.sh`, docs, agent files) have no dedicated CI job; verify `scripts/check_tag_version.sh` still passes unmodified since it isn't touched.

## Notes

- Exact library API method names/signatures for `config`/`engineStart`/`engineStop` are left to implementation-time judgment — the issue only fixes the scope (those three `/api/*` routes) and the wrapper style (thin, no client-side config/resource logic).
- Whether `clients/node/` gets a dedicated Docker Compose service + Dockerfile for local dev parity (like `navi_tests` for `source/`) was not explicitly requested in the issue and CircleCI doesn't need it (CI runs plain `yarn`/`npm` commands). Left as an optional follow-up rather than a required step here, to avoid inventing infra decisions (base image, builder stages) the issue didn't specify.
- Root `README.md`'s exact placement/format for the client's Current Version line is explicitly marked TBD in the issue — implementer should mirror the app's existing Current Version/Next Release badge style as closely as reasonable.
- Tagging scheme and CI publish trigger for `navi-hey-client` are out of scope for this issue (per the issue's explicit deferral) — a follow-up issue will need to decide e.g. a `client-X.Y.Z` tag prefix and a corresponding `npm-publish-client` CircleCI job before the package can actually be released to npm.

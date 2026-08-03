# Issue: Add Navi client

## Description
Navi exposes a token-secured `/api/*` HTTP namespace (`POST /api/config`, `POST /api/engine/start`, `POST /api/engine/stop`) for external, programmatic control of a running instance, but there is no first-party client library for consuming it — callers must hand-roll requests and manage the bearer token themselves.

## Problem
Without a published client package, every integrator of Navi's `/api/*` namespace has to reimplement request construction, authentication, and error handling from scratch, which duplicates effort and increases the chance of inconsistent or incorrect usage across projects that integrate with Navi.

## Expected Behavior
- `navi-hey-client` is installable from npm and exposes methods to call `POST /api/config`, `POST /api/engine/start`, and `POST /api/engine/stop` against a running Navi instance, handling the `Authorization: Bearer <token>` header internally.
- `navi-hey-client` also ships a `navi-client` CLI command (like `source/bin/navi.js`'s `navi-hey` command) so the `/api/*` calls can be driven from a shell/script without writing Node code, in addition to being usable as a plain library import.
- `scripts/bump_version.sh` supports `bump_version.sh [app|client] [version]`; omitting the target defaults to `app` (unchanged behavior); omitting the version auto-increments the target's current patch version.
- Root `README.md` reflects both the app's and the client's current version (version info only — usage/install docs for the client live in `clients/node/README.md`, not the root README).

## Solution

### Package structure & tooling
- New top-level `clients/` folder, one subfolder per supported language. First language is Node: `clients/node/`. Future languages (e.g. Python) get their own subfolder alongside it.
- The npm package published from `clients/node/` is named `navi-hey-client`.
- The main source file is **not** `index.js` (that name reads as something exposed to the web) — use a descriptive name instead, e.g. `clients/node/client.js`, referenced via `package.json`'s `"main"`.
- Scope for now: a thin wrapper over the token-secured `/api/*` namespace only (`POST /api/config`, `POST /api/engine/start`, `POST /api/engine/stop`) — no replication of config/resource logic client-side. Other routes (`/engine/status`, `/jobs`, `/stats.json`, etc.) are out of scope.
- Both a library entrypoint (importable functions/methods) and a CLI entrypoint are exposed, mirroring how `source/package.json` declares both `"main"` and `"bin"`. The published npm package is `navi-hey-client`; the CLI command it installs is `navi-client` (shorter, distinct from the package name — same pattern as `source/package.json`'s `"bin": { "navi-hey": "bin/navi.js" }`).
- Node-only for now (no browser/bundler concerns yet).
- Follows the same conventions already used by `source/`, `dev/app/`, and `frontend/`: plain JS, ESM (`"type": "module"`), Jasmine + c8 for tests, ESLint with the `standard` config, jscpd for duplication reports. No TypeScript, no new bundler.
- Like `source/`, `clients/node/` gets its own npm-facing `README.md` (install/usage docs live here, not in the root README), separate from the root `README.md`.
- A new dedicated specialist agent, named `navi-client`, is added for this work at `.claude/agents/navi-client.md`, following the existing per-directory pattern (`engine.md`, `frontend.md`, `dev.md`) and registered in `architect.md`'s specialist table. Scoped to `clients/node/` for now; future language clients get their own dedicated agent when added.

### Versioning & bump_version.sh
- `scripts/bump_version.sh` gains a target argument: `bump_version.sh [app|client] [version]`. Omitting the target defaults to `app` (today's behavior, unchanged).
- The `[version]` argument becomes optional for both targets: when omitted, auto-increment the target's current patch version by 1, reusing the script's existing `NEXT_VERSION` (`MAJOR.MINOR.(PATCH+1)`) math against that target's current version.
- `app` target: same file edits as today (root `README.md` Current/Next Release badges, `source/package.json`, demo Dockerfile `FROM` tag).
- `client` target: bumps `clients/node/package.json`'s version. Root `README.md` gets a corresponding Current Version line for the client package (exact placement/format TBD at implementation time — mirror the app's Current/Next Release style).
- Tagging and CI publish triggers for the client package are explicitly **out of scope** for this issue — `bump_version.sh` only edits version numbers in files locally, same as it does today for the app. How/when client releases get tagged and published is left for a follow-up issue.

## Benefits
- External integrators get a maintained, tested client instead of hand-rolled HTTP calls, reducing integration bugs and duplicated auth/request logic.
- Independent versioning lets the client package evolve (and ship fixes) without forcing an app release, and vice versa.
- Establishes a reusable pattern (`clients/<language>/` + dedicated specialist agent) for adding clients in other languages later.

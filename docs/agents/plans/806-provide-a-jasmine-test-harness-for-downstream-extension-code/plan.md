# Plan: Provide a Jasmine test harness for downstream extension code

Issue: [806-provide-a-jasmine-test-harness-for-downstream-extension-code.md](../../issues/806-provide-a-jasmine-test-harness-for-downstream-extension-code.md)

## Overview

Turn IMPL-5's ad-hoc, copy-pasted extension test harness into a shipped
`darthjee/navi-hey-test` Docker image (a lean-production sibling of
`dockerfiles/production_navi_hey/`) that bakes both Navi toolchains, the reused
`frontend/spec/support/*` files, the SPEC-6 §10 `navi-hey/testing` doubles **at a
baked path only** (no `source/package.json` publish-surface change), two
`spec_dir`-scoped `jasmine.json` configs run as two separate processes, a `c8`
config scoped to the author's `src/**`, and the `/navi/node_modules/navi-hey`
resolution used at runtime. Navi's CI gains a PR-time self-test job (build the
image, run the worked example's suite through it) and a version-tag-gated
`build-and-release-navi-hey-test` job. `examples/navi-orders-extension/` is
converted to consume the image (SPEC-6 §9), and the durable guidance moves into
`docs/guides/navi/extending-navi.md`.

SPEC-6 ([`docs/agents/future/downstream-extension-tests.md`](../../future/downstream-extension-tests.md))
is the frozen design; where this plan and SPEC-6 disagree, SPEC-6 (and, above it,
`extension-architecture.md`) wins.

## Agents involved

- [docker](docker.md) — the new `dockerfiles/navi-hey-test/` image and its root `docker-compose.yml` service
- [guide](guide.md) — converting `examples/navi-orders-extension/` to consume the image
- [docs](docs.md) — the extension-testing section of `docs/guides/navi/extending-navi.md`
- [architect](architect.md) — `.circleci/config.yml`, `Makefile`, and `scripts/` wiring (root files, no specialist owns them)

`engine` and `frontend` carry **no** work despite the issue's `Agents` line — see
Notes. The line was narrowed during planning once "doubles baked in the image
only" was chosen.

## Shared contracts

Everything below is produced by **docker** and consumed by the other three.

### 1. Image identity

- Repository: `darthjee/navi-hey-test`.
- Tags: `:<git-tag>` (the Navi version tag, e.g. `1.10.0`) and `:latest`.
- **amd64 only** — matches Navi's own `build-and-release` (`Makefile` `PLATFORM
  := linux/amd64`). SPEC-6's `-arm64` variant suggestion is deferred; Navi
  publishes no arm64 images today.
- Dockerfile: `dockerfiles/navi-hey-test/Dockerfile`, build context = repo root.
- `FROM darthjee/node:0.2.1`, reusing the `dockerfiles/dev_navi_hey/` +
  `dockerfiles/dev_frontend/` `yarn_builder.sh` cache-warm pattern. Extracting a
  shared `dev_navi_hey-base` layer first is **optional** (SPEC-6 §6) and left to
  docker's discretion; not required by this plan.

### 2. Entrypoint interface

`ENTRYPOINT` is a dispatch script; `CMD` defaults to `all`.

| Invocation | Behaviour |
|---|---|
| _(no args)_ / `all` | run backend suite, then frontend suite, as **two separate `node` processes**; non-zero exit if either fails |
| `backend` | backend suite only |
| `frontend` | frontend suite only |
| `all --coverage` / `backend --coverage` / `frontend --coverage` | same, wrapped in `c8` with the baked config |
| `lint` | `eslint` over the mounted `src/` + `tests/` |
| `sh` | interactive shell in the image |

### 3. Mount + discovery contract

- Author bind-mounts their project's `src/` → **`/work/src`** and `tests/` →
  **`/work/tests`** (both `:ro`). Image `WORKDIR` is `/work`.
- Baked backend config: `spec_dir` = `/work/tests/backend`, `spec_files` =
  `["**/*_[sS]pec.js"]`, no helpers, no `--import`.
- Baked frontend config: `spec_dir` = `/work/tests/frontend`, `spec_files` =
  `["**/*_[sS]pec.@(js|jsx)"]`, `helpers` = the baked `dom.js`; the process runs
  `node --import <baked>/loader.js node_modules/.bin/jasmine --config=<baked
  frontend jasmine.json>`.
- Baked `c8` config: `include: ["src/**/*.js", "src/**/*.jsx"]`; `exclude`
  covers `tests/**`, `dist/**`, `node_modules/**`, and every baked Navi path;
  `check-coverage: false`.
- Navi's own `source/spec/` and `frontend/spec/` globs appear on **no** load
  path the run sees, and no `spec_dir` is a parent of both trees.

### 4. `navi-hey/*` resolution inside the image

- `/navi/node_modules/navi-hey/` is a **baked directory** (not a symlink to the
  global package as in production): it carries Navi's `lib/` tree plus a baked
  `package.json` whose `exports` map is:
  - `"./extension"` → the real `lib/common/server/RequestHandler.js` (byte-identical to what the runtime image resolves — "what you test is what runs");
  - `"./testing/axios.js"` → the promoted `source/spec/support/utils/AxiosUtils.js`;
  - `"./testing/logger.js"` → the promoted `source/spec/support/utils/LoggerUtils.js`;
  - `"./testing/dom.js"` → the reused `frontend/spec/support/dom.js`;
  - `"./testing/fetch.js"` → the reused `frontend/spec/support/fetch.js`.
- `LoggerUtils.js` keeps its relative imports into `lib/` — the baked tree must
  preserve the `spec/support/utils/` ↔ `lib/` relative offset (copy both under
  `/navi/node_modules/navi-hey/` unchanged).
- The reused `loader.js` / `transform_hooks.js` are baked too but are wired by
  the frontend `jasmine.json` (`--import` + `helpers`), **not** exposed on the
  `navi-hey/testing` subpath.
- These four `frontend/spec/support/*` files and two
  `source/spec/support/utils/*` files are baked **verbatim** — no edits in
  `frontend/` or `source/`.

### 5. CI hooks (architect consumes docker's `Makefile` targets)

- PR job builds the image and runs `examples/navi-orders-extension/tests/`
  through it (`backend` + `frontend`), gating `npm-publish` alongside the
  existing `smoke-extensions`.
- `build-and-release-navi-hey-test` is version-tag-gated, `requires` the
  existing `jasmine` / `jasmine-frontend` / `checks` / `checks-frontend` jobs,
  and runs a `make release-navi-hey-test TAG=${CIRCLE_TAG}` target.

## Notes

- **`engine` / `frontend` have no file changes.** With "doubles baked in the
  image only", the promoted backend doubles
  (`source/spec/support/utils/{AxiosUtils,LoggerUtils}.js`) and the reused
  frontend support files (`frontend/spec/support/{dom,fetch,loader,transform_hooks}.js`)
  are copied into the image unchanged; the `navi-hey/testing` subpath is
  provided by an image-baked `package.json`, not by `source/package.json`
  `exports`/`files`. If, during implementation, docker finds a promoted double
  cannot resolve from the baked layout without editing the source file, stop and
  escalate to `architect` — that would reopen the SPEC-6 §12 packaging call.
- **The example loses Docker-free `npm test`.** SPEC-6 §7 accepts this: the
  example is a downstream-consumer stand-in and consumes the delivery mechanism
  (the image) like any real one. `npm run build` (Vite) stays local.
- **`guide` ↔ `docs` must not drift.** `guide.md`'s convention keeps
  `examples/navi-orders-extension/` byte-aligned with the "Worked example"
  section of `docs/guides/navi/extending-navi.md`; the `npm test` line, the
  `docker compose run --rm extension_tests` command, and the compose service
  definition must read identically in both places.
- **CLEAN-1 (#807)**, not this issue, deletes
  `docs/agents/future/downstream-extension-tests.md` and folds internals notes
  into `docs/agents/web-server.md` / `docs/agents/frontend.md`. IMPL-6 only
  touches the user-facing guide.
- **No arm64.** Deviates from SPEC-6 §6/§8's `-arm64` mention to match Navi's
  actual amd64-only release practice; revisit if Navi starts publishing arm64.

## CI Checks

- `dockerfiles/navi-hey-test/` — `make build-navi-hey-test` then
  `make test-extension-harness` (CI job: `test-extension-harness`, new).
- `examples/navi-orders-extension/` — `make test-extension-harness` exercises
  it through the image; the existing `make smoke-extensions` (CI job:
  `smoke-extensions`) still covers the composed-stack path.
- `source/`, `frontend/` — unchanged; existing `jasmine` / `jasmine-frontend` /
  `checks` / `checks-frontend` jobs still pass (no files touched there).

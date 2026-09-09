# Docker Plan: Provide a Jasmine test harness for downstream extension code

Main plan: [plan.md](plan.md)

## Shared contracts

You **produce** all of contracts 1–4 in [plan.md](plan.md#shared-contracts);
`guide`, `docs`, and `architect` consume them. The non-negotiable points:

- Image `darthjee/navi-hey-test`, `FROM darthjee/node:0.2.1`, context = repo
  root, **amd64 only**.
- Entrypoint dispatch: `all` (default) / `backend` / `frontend` / `lint` / `sh`,
  each accepting `--coverage`. `all` runs backend then frontend as **two
  separate `node` processes** (never one process, so helpers / jsdom globals /
  coverage never cross between suites).
- Author mounts `src/` → `/work/src`, `tests/` → `/work/tests` (`:ro`);
  `WORKDIR /work`.
- `navi-hey/extension` resolves to the **real** `RequestHandler.js` (identical
  file to the runtime image); `navi-hey/testing/{axios,logger,dom,fetch}.js`
  resolve via an image-baked `/navi/node_modules/navi-hey/package.json`
  `exports` map — **not** `source/package.json`.
- The six reused files
  (`source/spec/support/utils/{AxiosUtils,LoggerUtils}.js`,
  `frontend/spec/support/{dom,fetch,loader,transform_hooks}.js`) are baked
  **verbatim** — do not edit them in `source/` or `frontend/`. If any cannot
  resolve from the baked layout without a source edit, stop and escalate to
  `architect`.

## Implementation Steps

### Step 1 — Build the `navi-hey-test` image

Create `dockerfiles/navi-hey-test/` with:

- **`Dockerfile`** — multi-stage, `FROM darthjee/node:0.2.1`, reusing the
  `yarn_builder.sh` cache-warm pattern from `dockerfiles/dev_navi_hey/Dockerfile`
  and `dockerfiles/dev_frontend/Dockerfile` (copy each `package.json` +
  `yarn.lock`, run the builder, restore the yarn cache in the final stage).
  Bake:
  - Navi `source/` with its **full** `devDependencies` installed (jasmine, c8,
    eslint) so `npx jasmine` / `eslint` run; `frontend/` with its full
    `devDependencies` (jasmine, jsdom, esbuild, c8, eslint).
  - `/navi/node_modules/navi-hey/` as a real directory: `source/lib/` +
    `source/spec/support/utils/{AxiosUtils,LoggerUtils}.js` copied preserving the
    `spec/support/utils/` ↔ `lib/` relative offset (so `LoggerUtils.js`'s
    `../../../lib/...` imports still resolve), plus `frontend/spec/support/*`
    copied to a subfolder of the package, plus a **baked `package.json`** whose
    `exports` is exactly:
    ```json
    {
      "./extension": "./lib/common/server/RequestHandler.js",
      "./testing/axios.js": "./spec/support/utils/AxiosUtils.js",
      "./testing/logger.js": "./spec/support/utils/LoggerUtils.js",
      "./testing/dom.js": "./frontend-support/dom.js",
      "./testing/fetch.js": "./frontend-support/fetch.js",
      "./package.json": "./package.json"
    }
    ```
    (adjust the `frontend-support/` path name to taste; keep the four
    `./testing/*.js` keys verbatim — `guide` and `docs` hard-code them).
  - Baked configs at a fixed path (e.g. `/opt/navi-hey-test/`):
    - `jasmine.backend.json` — `spec_dir: /work/tests/backend`, `spec_files:
      ["**/*_[sS]pec.js"]`, no `helpers`.
    - `jasmine.frontend.json` — `spec_dir: /work/tests/frontend`, `spec_files:
      ["**/*_[sS]pec.@(js|jsx)"]`, `helpers: ["<baked>/dom.js"]`.
    - `c8.json` — `include: ["src/**/*.js", "src/**/*.jsx"]`; `exclude`:
      `tests/**`, `dist/**`, `node_modules/**`, `/navi/**`, `/opt/**`;
      `check-coverage: false`; `all: true`.
  - The reused `loader.js` / `transform_hooks.js` at `/opt/navi-hey-test/` for
    the frontend `--import`.
  - `WORKDIR /work`; `USER node`.
- **`entrypoint.sh`** (`dockerfiles/navi-hey-test/entrypoint.sh`, `chmod +x`,
  set as `ENTRYPOINT`) — parse the first arg as the subcommand (default `all`)
  and a `--coverage` flag:
  - `backend` → `npx jasmine --config=/opt/navi-hey-test/jasmine.backend.json`
    (wrapped in `npx c8 --config=/opt/navi-hey-test/c8.json` when `--coverage`).
  - `frontend` → `node --import /opt/navi-hey-test/loader.js
    node_modules/.bin/jasmine --config=/opt/navi-hey-test/jasmine.frontend.json`
    (same `c8` wrap when `--coverage`). The `node_modules/.bin/jasmine` here is
    the **frontend** toolchain's — resolve it from the baked `frontend/` install
    (mirror `frontend/package.json`'s `spec` script mechanics).
  - `all` → run `backend` then `frontend`, each in its own process; exit
    non-zero if either did.
  - `lint` → `eslint /work/src /work/tests` using a baked flat config (or
    Navi's `frontend/` eslint config) — keep it lenient; this is a convenience,
    not a gate.
  - `sh` → `exec /bin/bash`.
  - `CMD ["all"]`.

Verify locally: `docker build -f dockerfiles/navi-hey-test/Dockerfile -t
navi-hey-test:dev .`, then from `examples/navi-orders-extension/` (after
`guide`'s changes, or with a temporary hand mount)
`docker run --rm -v "$PWD/src:/work/src:ro" -v "$PWD/tests:/work/tests:ro"
navi-hey-test:dev` and confirm both suites run and Navi's own specs are not
enumerated.

### Step 2 — Root `docker-compose.yml` service

Add a `navi_hey_test` service to the root `docker-compose.yml` used by the new
`Makefile` targets (`architect`'s scope) to build/run the image in CI and
locally:

```yaml
  navi_hey_test:
    build:
      context: .
      dockerfile: dockerfiles/navi-hey-test/Dockerfile
    image: navi-hey-test:dev
    working_dir: /work
    volumes:
      - ./examples/navi-orders-extension/src:/work/src:ro
      - ./examples/navi-orders-extension/tests:/work/tests:ro
```

Keep it minimal and `profiles:`-gated or `depends_on`-free so it never starts
with `docker compose up`. This is the Navi-repo-side convenience wiring; the
**example's own** `docker-compose.yml` (with an `extension_tests` service) is
`guide`'s to write and lives under `examples/`.

## Files to Change

- `dockerfiles/navi-hey-test/Dockerfile` — **new**: the test image.
- `dockerfiles/navi-hey-test/entrypoint.sh` — **new**: subcommand dispatch.
- `dockerfiles/navi-hey-test/jasmine.backend.json` — **new**: baked backend runner config.
- `dockerfiles/navi-hey-test/jasmine.frontend.json` — **new**: baked frontend runner config.
- `dockerfiles/navi-hey-test/c8.json` — **new**: baked coverage config (`src/**` only).
- `dockerfiles/navi-hey-test/navi-hey.package.json` — **new**: the baked `exports` map copied to `/navi/node_modules/navi-hey/package.json`.
- `docker-compose.yml` — add the `navi_hey_test` build/run service.

## CI Checks

- `make build-navi-hey-test` (target added by `architect`) must succeed on the
  branch; `make test-extension-harness` must pass (CI job:
  `test-extension-harness`, added by `architect`).
- No branch/PR job builds arbitrary Dockerfiles otherwise — verify locally per
  `.claude/agents/docker.md`.

## Notes

- Do not symlink `/navi/node_modules/navi-hey` to the global package (the
  production pattern) — the test image needs the extra `./testing/*` exports and
  the `spec/support` + `frontend-support` trees, so it bakes its own copy.
- The `./extension` target must stay byte-identical to
  `source/lib/common/server/RequestHandler.js` so "what you test is what runs"
  holds.
- Keep the image lean-production in spirit: toolchains and doubles only, no app
  runtime config (`config/menu.yml` is not needed for unit tests, SPEC-6 §6).
- If you choose to extract a shared `dev_navi_hey-base` stage first (SPEC-6 §6,
  optional), keep it a pure refactor with no behaviour change to the existing
  dev images and call it out for `architect` review.

# Dedicated test image; Config-driven runs; CI hook

Add the sections that describe the deliverable IMPL-6 builds: a sibling Docker
image plus how it is invoked and wired into a downstream CI.

## Dedicated extension test image section

Model explicitly on Tent's `darthjee/tent-test` (cite `~/messages/extension.md`'s
pattern: production stays lean, tooling lives only where tests run, same extension
mount path as production so "what you test is what runs").

Cover, each ending on a concrete recommendation:

- **Placement** — a new `dockerfiles/<name>/Dockerfile` sibling of
  `dockerfiles/production_navi_hey/`. Recommend a name
  (candidate `navi-hey-test`, matching the `navi-hey` package / `darthjee/navi`
  image family) and flag it as IMPL-6's final call.
- **Base** — `FROM darthjee/node:0.2.1` like the dev images, reusing the
  `yarn_builder.sh` cache-warm pattern. Note the option (IMPL-6's call) of first
  extracting a shared `dev_navi_hey-base` layer so this image and the internal
  `navi:dev` share an identical Node build — Tent's `dev_tent-base` insight for
  parity.
- **What it bakes in**:
  - Navi `source/` + its `devDependencies` (jasmine, c8, eslint) so `npx jasmine`
    runs; Navi `frontend/` + its `devDependencies` (jasmine, jsdom, esbuild, c8).
  - `frontend/spec/support/{loader,transform_hooks,dom,fetch}.js` at a stable path.
  - The promoted `source/spec/support/*` doubles (step 04) at a stable path.
  - Default backend and frontend `jasmine.json` whose `spec_dir` points at the
    mounted `tests/backend` / `tests/frontend` (isolation — step 01).
  - The `/navi/node_modules/navi-hey` symlink (SPEC-5 §1) plus a symlink/`exports`
    entry for the `navi-hey/testing` doubles subpath, so imports resolve from the
    mounted spec files.
- **Decide: one image, two subcommands vs. two images.** Recommend **one image**
  with a small entrypoint dispatching `backend` / `frontend` / `all` (default
  `all`), `lint`, and `sh` — halves the release matrix; the two suites still run
  as separate Jasmine processes internally (step 01).
- **Mounts** — the author bind-mounts: their `src/` (pre-build extension source),
  their `tests/`, and — for parity/integration checks — the built `dist/` at
  `/navi/extensions` (the same volume production uses). `config/menu.yml` is not
  needed for unit tests. Give one concrete `docker run -v …` and one
  `docker-compose.yml` service example (reuse SPEC-5 §6a's compose shape).
- **Default command** — runs the author's suites immediately with no arguments;
  overridable (`… sh`, `… backend`, `… lint`, `… all --coverage`). Mirror Tent's
  `CMD ["vendor/bin/phpunit"]` posture.

## Config-driven runs section

- The parent issue's "runnable with Navi's tooling" resolves to: **the dedicated
  image's baked default command** — not a new `yarn` script inside `source/` or
  `frontend/`, and not a `Makefile` target in Navi's repo (the `make tests` target
  is for developing Navi itself). Navi's own `package.json` files are untouched by
  this feature.
- The author's own project keeps a thin `package.json` `"test"` script that just
  invokes `docker compose run --rm extension_tests` (or the `docker run` form), so
  `npm test` works locally and in CI without assembling a toolchain.
- Concrete recommendation: document both the `docker run` one-liner and the
  compose service, with the compose service as the recommended default.

## CI hook section

- A downstream project adds one CI job: build (or pull) the pinned
  `navi-hey-test:<tag>` image, then `docker compose run --rm extension_tests`.
- Recommend pinning the test image tag to the exact `navi-hey` version the
  deployment runs `FROM`, and running this job on every PR — restating SPEC-5 §8's
  upgrade checklist (React/Router alignment, `navi-hey/extension` still resolves,
  route-name collisions, restart-not-reload).
- Note how Navi itself will wire the image build/push into `.circleci/config.yml`
  next to `build-and-release` (its own tags + arch variants, gated on the existing
  `jasmine` / `checks` jobs) — parallel to Tent's
  `build-and-release-tent-test-*` jobs. This is guidance for IMPL-6, not a change
  here.

## Files to Change

- `docs/agents/future/downstream-extension-tests.md` — add the **Dedicated
  extension test image**, **Config-driven runs**, and **CI hook** sections.

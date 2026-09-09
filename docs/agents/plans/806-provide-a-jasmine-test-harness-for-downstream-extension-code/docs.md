# Docs Plan: Provide a Jasmine test harness for downstream extension code

Main plan: [plan.md](plan.md)

## Shared contracts

Consumed from `docker` / `guide` (see [plan.md](plan.md#shared-contracts)):

- Image `darthjee/navi-hey-test:<navi-tag>`, pinned to the `darthjee/navi-hey`
  tag the downstream project deploys `FROM`.
- Commands: `docker compose run --rm extension_tests` (recommended) or
  `docker run --rm -v "$PWD/src:/work/src:ro" -v "$PWD/tests:/work/tests:ro"
  darthjee/navi-hey-test:<navi-tag>`; overrides `backend` / `frontend` / `all`
  (default) / `lint` / `sh`, plus `--coverage`.
- Author project layout: specs under `tests/backend/*_spec.js` and
  `tests/frontend/*_spec.jsx`, run against `src/` (no build step before tests).
- Double specifiers: `navi-hey/testing/{dom,fetch,axios,logger}.js`;
  `navi-hey/extension` unchanged.
- The `examples/navi-orders-extension/` **## Test** section and its
  `docker-compose.yml` `extension_tests` service — this doc must read
  identically (the `guide` no-drift convention, mirrored here).

## Implementation Steps

### Step 1 — Rewrite the extension-testing section of `extending-navi.md`

In `docs/guides/navi/extending-navi.md`:

- Replace the current deferral paragraph (around line 315: *"For testing your
  extension in isolation … see the design doc's worked example and the
  downstream test harness referenced from `downstream-extension-workflow.md`"*)
  and the intro line's `downstream-extension-workflow.md` test reference (around
  line 7) with a real section. It should cover, at operator/author altitude
  (not internals — those stay for CLEAN-1 #807):
  - **What it is** — a prebuilt image, `darthjee/navi-hey-test`, that bundles
    Navi's Jasmine toolchain (backend + frontend), the jsdom/esbuild frontend
    setup, and a set of reusable Navi test doubles, so an extension project runs
    its own suite with zero local test toolchain.
  - **Project layout** — `tests/backend/*_spec.js` (drives the handler
    directly: fake `req`/`res`, `new handler(req, res).handle()`), and
    `tests/frontend/*_spec.jsx` (renders the page with `useContainer` +
    `spyOn(globalThis, 'fetch')` / `mockFetchSuccess`). Specs import from
    `src/` directly — no build first. Show the two worked-example specs
    (`orders_spec.js`, `orders_page_spec.jsx`) as they now stand in
    `examples/navi-orders-extension/tests/`.
  - **Test doubles** — `import { RequestHandler } from 'navi-hey/extension'`
    (same specifier as production), `import { useContainer } from
    'navi-hey/testing/dom.js'`, `mockFetchSuccess` / `mockFetchFailure` from
    `navi-hey/testing/fetch.js`, and `navi-hey/testing/axios.js` /
    `navi-hey/testing/logger.js` for handlers that make outbound HTTP or log.
    Flag them as quasi-public API — pinned to the image tag, may change between
    Navi versions.
  - **Running it** — the `docker-compose.yml` `extension_tests` service
    (mounting `./src` and `./tests`), `docker compose run --rm extension_tests`,
    and the `package.json` `"test": "docker compose run --rm extension_tests"`
    line. Mention the `backend` / `frontend` / `all` / `--coverage` overrides.
  - **Isolation** — Navi's own `source/spec/` and `frontend/spec/` are never
    run; backend and frontend run as separate processes; coverage (`--coverage`)
    is scoped to the author's `src/**` only.
  - **CI hook** — one job in the downstream project: build/pull
    `darthjee/navi-hey-test:<navi-tag>` pinned to the deployment's Navi tag,
    then `docker compose run --rm extension_tests`, on every PR. This is also
    where the "Upgrading the base image" checklist item 4 ("re-run your
    extension's own tests") is exercised.
- In the existing **### Upgrading the base image** checklist, make item 4 point
  at this new section (and keep item 1's React/React-Router alignment note — the
  image pins the same majors the SPA ships).
- Keep the intro's pointer to `downstream-extension-workflow.md` for the
  container-side loader mechanics, but drop the "downstream test harness" half
  of that sentence (this page now owns it).

Verify internal links resolve and the code snippets match
`examples/navi-orders-extension/` verbatim after `guide`'s changes.

## Files to Change

- `docs/guides/navi/extending-navi.md` — replace the testing-deferral paragraphs
  with a full extension-testing section (image, layout, doubles, run, isolation,
  CI hook); repoint the upgrade-checklist item.

## Notes

- Author/operator altitude only. Do **not** document the image's internal baked
  paths, the `exports` map, or the `dev_navi_hey-base` question — those are
  `dockerfiles/navi-hey-test/` internals and, per SPEC-6, get folded into
  `docs/agents/web-server.md` / `docs/agents/frontend.md` by CLEAN-1 (#807), not
  here.
- Do not touch `docs/agents/*` (that's `architect`), `AGENTS.md`, or any source
  tree (`.claude/agents/docs.md` out-of-scope). Confirm exact command strings
  and the compose block with `guide` before writing — no guessing.
- The transient design doc `docs/agents/future/downstream-extension-tests.md`
  stays in place until CLEAN-1; you may link to it as "design rationale" but the
  guide must stand on its own.

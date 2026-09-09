# Guide Plan: Provide a Jasmine test harness for downstream extension code

Main plan: [plan.md](plan.md)

## Shared contracts

Consumed from `docker` (see [plan.md](plan.md#shared-contracts)):

- Image: `darthjee/navi-hey-test:<navi-tag>` (dev tag `navi-hey-test:dev`
  locally).
- Run command for a downstream project:
  `docker run --rm -v "$PWD/src:/work/src:ro" -v "$PWD/tests:/work/tests:ro"
  darthjee/navi-hey-test:<navi-tag>` — or the compose form
  `docker compose run --rm extension_tests`.
- Test-double specifiers: `navi-hey/testing/dom.js`,
  `navi-hey/testing/fetch.js`, `navi-hey/testing/axios.js`,
  `navi-hey/testing/logger.js` — resolvable inside the image only.
- Discovery: backend specs at `tests/backend/**/*_[sS]pec.js`, frontend specs at
  `tests/frontend/**/*_[sS]pec.@(js|jsx)`. The existing
  `tests/backend/orders_spec.js` and `tests/frontend/orders_page_spec.jsx`
  already match — keep that layout.

Must stay byte-aligned with `docs`' rewrite of the "Worked example" /
extension-testing section of `docs/guides/navi/extending-navi.md` (the
`.claude/agents/guide.md` no-drift convention). Coordinate the exact `npm test`
line, the `docker compose run` command, and the compose service block.

## Implementation Steps

### Step 1 — Convert the project to consume the image

In `examples/navi-orders-extension/`:

- **Delete `spec/support/` entirely** — the four copied support files
  (`dom.js`, `fetch.js`, `loader.js`, `transform_hooks.js`), the local
  `navi-hey` stub (`spec/support/navi-hey/{extension.js,package.json}`), and
  `spec/support/jasmine.json`. The image provides all of these.
- **`package.json`**:
  - `test` script → `docker compose run --rm extension_tests`.
  - Remove the now-unused test-only `devDependencies`: `jasmine`, `jsdom`,
    `esbuild`, `c8`, and the `"navi-hey": "file:./spec/support/navi-hey"` entry.
  - Keep only what `npm run build` (Vite) needs: `vite`,
    `@vitejs/plugin-react`, and `react` / `react-dom` / `react-router-dom` (Vite
    needs them resolvable to mark them external — verify `npm run build` still
    produces `dist/frontend/orders.js` + `orders.css` and `dist/backend/orders.js`).
  - Regenerate `package-lock.json` (`npm install`) to match.
- **`tests/frontend/orders_page_spec.jsx`** — change the two support imports:
  ```js
  import { useContainer } from 'navi-hey/testing/dom.js';
  import { mockFetchSuccess } from 'navi-hey/testing/fetch.js';
  ```
  Leave the rest (`import descriptors from '../../src/frontend/entry.js'`, the
  `act` render, the assertions) unchanged — it already matches the SPEC-6 §9
  Jasmine style.
- **`tests/backend/orders_spec.js`** — no change needed (it imports only
  `../../src/backend/orders.js` and hand-rolls the `response` double).
- Update `.gitignore` only if `coverage/` location changes (it does not).

### Step 2 — Compose service + README

- **`examples/navi-orders-extension/docker-compose.yml`** — **new**, the
  downstream-consumer pattern from SPEC-6 §6/§7:
  ```yaml
  services:
    extension_tests:
      image: darthjee/navi-hey-test:latest   # pin to your deployment's Navi tag
      volumes:
        - ./src:/work/src:ro
        - ./tests:/work/tests:ro
        # - ./dist:/navi/extensions:ro   # optional parity check
  ```
  Note in a comment that the tag must match the `darthjee/navi-hey` tag the
  project deploys `FROM`.
- **`README.md`** — rewrite the **## Test** section: `npm test` now runs the
  suite **in the `navi-hey-test` container** (`docker compose run --rm
  extension_tests`), against `src/` + `tests/`, with no local toolchain; add one
  line that the image tag should be pinned to the Navi version in use. Keep
  **## Build** (`npm ci && npm run build`) and **## Run against Navi** as they
  are. Update **## Note on npm** if it still implies a local test toolchain.

Verify: `npm run build` still succeeds; `docker compose run --rm
extension_tests` (with `docker` Step 1's `navi-hey-test:dev` retagged or built)
runs both `tests/backend/` and `tests/frontend/` green.

## Files to Change

- `examples/navi-orders-extension/spec/` — **delete** the whole `support/` tree.
- `examples/navi-orders-extension/package.json` — `test` script + trimmed `devDependencies`.
- `examples/navi-orders-extension/package-lock.json` — regenerated.
- `examples/navi-orders-extension/tests/frontend/orders_page_spec.jsx` — imports switched to `navi-hey/testing/*`.
- `examples/navi-orders-extension/docker-compose.yml` — **new**: `extension_tests` service.
- `examples/navi-orders-extension/README.md` — **## Test** section rewrite.

## Notes

- The example deliberately loses the ability to run its tests without Docker
  (SPEC-6 §7). `npm run build` stays local and unchanged.
- Do not touch `dockerfiles/`, the root `docker-compose.yml`, `.circleci/`, or
  `Makefile` (`.claude/agents/guide.md` out-of-scope) — the `extension_tests`
  compose file here lives under `examples/` and is yours; the Navi-repo-side
  `navi_hey_test` service is `docker`'s.
- If `npm run build` turns out to need `jasmine`/`esbuild` after all (it should
  not — esbuild was only for the JSX spec loader, now baked in the image),
  keep the minimal set that makes the build pass and note it.
- Keep the SPEC-5 fixed identifiers (`orders`, `/ext/orders`,
  `OrdersSummaryHandler`, `OrdersPage`, `Orders`) untouched.

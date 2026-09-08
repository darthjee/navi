# Feature: Downstream Jasmine test setup for extension code

Part of #794 (**extension track**) — this is **SPEC-6**. Transient design
material: removed by **CLEAN-1 (#807)** once the feature ships, with the durable
parts folded into the permanent user guide
[`docs/guides/navi/extending-navi.md`](../../guides/navi/extending-navi.md) and,
where they describe internals, into
[`docs/agents/web-server.md`](../web-server.md) /
[`docs/agents/frontend.md`](../frontend.md).

Where [`extension-architecture.md`](extension-architecture.md) (SPEC-3 / #797 and
SPEC-4 / #798) fixed the **container contract** — what Navi scans, loads, and
serves from the mounted folder and the shape of each descriptor — and
[`downstream-extension-workflow.md`](downstream-extension-workflow.md) (SPEC-5 /
#799) laid out the **author's own project** — repo layout, build tooling,
image/compose wiring, worked example — this document owns the **test harness**:

- **Discovery** — where an extension's spec files live and how the runner finds
  only them.
- **Backend harness** — how a backend spec loads the extension module and Navi's
  baked test doubles, and the command that runs it.
- **Frontend harness** — how `frontend/spec/support/`'s jsdom + esbuild setup is
  reused for extension pages, and the command that runs it.
- **The dedicated extension test image** — a lean-production *sibling* image,
  modelled on Tent's `darthjee/tent-test`, that bakes both toolchains, a curated
  set of reusable Navi test doubles, and default `jasmine.json` configs scoped to
  the *mounted* test folders.
- **Config-driven runs** — the "runnable with Navi's tooling" answer: the image's
  baked default command, not a new script inside Navi.
- **Isolation guarantees** — independent `jasmine.json`, no global
  cross-contamination, coverage scoped to the author's `src/`.
- **CI hook** — how a downstream project wires this into its own CI against a
  container built `FROM` the pinned Navi tag.

It feeds **IMPL-6 (#806)** ("build the downstream extension test harness and its
image"), which must be buildable from this document with no further discovery /
isolation decisions.

---

## 1. Scope & relationship to SPEC-3 / SPEC-4 / SPEC-5

This document **does not re-decide** anything from the two specs above. It reuses,
verbatim:

| Surface | Fixed by | Value |
|---|---|---|
| Mount path | SPEC-3 Shared contract | `NAVI_EXTENSIONS_DIR` — absolute container path; default `/navi/extensions`; one volume, two reserved flat non-recursive subtrees `backend/` and `frontend/`; lexicographic load order |
| Mounted content | SPEC-3/4 | **built artefacts only** — `backend/*.js` copied verbatim from source (no transform), `frontend/*.js` a pre-built ESM bundle with React externalised, optional same-basename `.css` |
| Backend descriptor | SPEC-3 § Route declaration | `{ method, path, handler }` — `method` ∈ `GET`/`PATCH`/`POST` (case-insensitive); `path` non-empty, starts with `/`, no whitespace; `handler` a `RequestHandler` **subclass**, instantiated per request as `new handler(req, res)` |
| Backend error mapping | SPEC-3 § Route declaration | `ConflictError`→409, `ForbiddenError`→403, `NotFoundError`→404, anything else→500; `express.json()` already applied; `GET` `handle()` runs sync, `PATCH`/`POST` `handle()` is awaited |
| Frontend descriptor | SPEC-4 § `frontend/` subtree layout | default-exports `[{ path, text, component }]` — `path` becomes a `<Route>` under the existing `HashRouter`; `text` is the menu label; `component` a React component (may be `React.lazy`) |
| React sharing | SPEC-4 § Single React instance | extension bundles build `react`, `react-dom`, `react-router-dom` as **externals**; at runtime the host `index.html` import map provides the single shared instance |
| Handler base-class specifier | SPEC-5 §1 | `import { RequestHandler } from 'navi-hey/extension'` — version-stable bare subpath; resolved from a file under the mount via a `/navi/node_modules/navi-hey` symlink one level **above** the mount point |
| Worked-example identifiers | SPEC-5 §7 | module `orders`, route `/ext/orders`, endpoint `GET /ext/orders/summary.json`, handler `OrdersSummaryHandler`, page `OrdersPage`, menu label `Orders` |

If this document and either spec disagree, **`extension-architecture.md` wins**
and this file is the bug (same rule SPEC-5 states).

### Contract item this document settles

SPEC-5 §7.2 / §9 show two ad-hoc example tests — `orders.spec.js` on
`node:test` + `node:assert`, `orders-page.spec.jsx` on `vitest` +
`@testing-library/react` — and explicitly defer the harness to this issue: "if
SPEC-6 lands first, its conventions win."

**Decision — the supported runner is Jasmine, the same runner Navi's own two
suites use.** The `node --test` and `vitest` / `@testing-library` variants are
**superseded**: §9 below restates both worked-example tests in Jasmine form, and
IMPL-5 (#805)'s `spec/fixtures/extensions/` fixture plus the `extending-navi.md`
retelling must adopt those two Jasmine versions when this spec lands (recorded as
a follow-up, not done here).

---

## 2. Discovery

**Where the specs live.** In the **author's own project**, never in the mounted
`dist/`. `/navi/extensions` carries built artefacts only (SPEC-3/4); a spec file
mounted there would be enumerated by no config and is out of contract. The specs
sit next to the source they exercise, in the SPEC-5 §2 layout:

```
navi-orders-extension/
  src/
    backend/orders.js          # plain ESM, copied verbatim into dist/backend/
    frontend/OrdersPage.jsx
    frontend/OrdersPage.css
    frontend/entry.js          # default-exports [{ path, text, component }]
  tests/
    backend/orders_spec.js     # exercises the handler in isolation
    frontend/orders_page_spec.jsx   # renders OrdersPage, asserts on output
```

**Filename alignment with Navi.** Navi's two suites both discover
`**/*[sS]pec.js`. SPEC-5's `orders.spec.js` / `orders-page.spec.jsx` are renamed
to **`orders_spec.js` / `orders_page_spec.jsx`** so the same glob matches — noted
for SPEC-5 re-alignment in §9. `.jsx` spec files are permitted for the frontend
suite (the esbuild loader transforms them at import time, §5).

**Run against the pre-build source.** Backend specs import `src/backend/*.js`
directly; frontend specs import `src/frontend/*.jsx` / `entry.js` directly and
let the esbuild loader handle `.jsx` at import time. No build step runs before a
test — exactly as SPEC-5 §7.2 already does. The mounted `dist/` is *not* the test
target (it is available as an optional mount for parity checks only, §6).

**How the runner finds only these files.** The dedicated image (§6) ships one
baked `jasmine.json` per suite whose `spec_dir` points at the **mounted** test
folder; the folder itself is the single source of truth and the author writes no
manifest. Concrete discovery rule:

- **backend specs** — `<tests-mount>/backend/**/*_[sS]pec.js`
- **frontend specs** — `<tests-mount>/frontend/**/*_[sS]pec.@(js|jsx)`

both loaded in lexicographic filename order, matching Navi's own convention.

**Recommendation.** The author places specs under `tests/backend/` and
`tests/frontend/` in their own repo, named `*_spec.js` / `*_spec.jsx`; the image
discovers them via a baked per-suite `jasmine.json` whose `spec_dir` is the
mounted `tests/` tree — no manifest, no build step, specs run against
`src/`.

---

## 3. Isolation guarantees

Each guarantee ends on a concrete recommendation.

**Independent `jasmine.json`.** The baked backend and frontend configs set
`spec_dir` to the mounted `tests/backend` / `tests/frontend` folder, so Navi's
own baked `source/spec/` and `frontend/spec/` trees are never enumerated. The
image must **not** place Navi's own `spec_files` globs (`**/*[sS]pec.js` rooted at
`source/spec` or `frontend/spec`) on any load path the extension run sees, and
must not point `spec_dir` at a parent of both trees. *Recommendation:* two
dedicated `jasmine.json` files baked at a fixed image path, each with
`spec_dir` = the mounted test folder and nothing else.

**No global cross-contamination.** The frontend jsdom globals are installed by
the reused `support/dom.js` (imported as a Jasmine `helper`); every frontend spec
gets the standard `useContainer` `beforeEach`/`afterEach` that creates and
unmounts a fresh React root per example. The backend suite installs **no**
globals and loads **no** helpers. *Recommendation:* the image runs backend and
frontend as **two separate Jasmine processes** (they need different Node
`--import` loaders anyway), so neither suite's `helpers`, globals, or jsdom
window can reach the other.

**Coverage scoping.** When coverage is requested, `c8` `include` points at the
author's `src/**` (`.js` + `.jsx`) and `exclude` covers `tests/**`, `dist/**`,
`node_modules/**`, and every baked Navi path (`source/**`, `frontend/**`, the
baked support / doubles paths). *Recommendation:* coverage is an **opt-in**
`--coverage` flag on the run command, not the default — mirroring Navi's own
`yarn spec` (no coverage) vs `yarn test` (c8) split — and the baked `c8` config
carries the `src/**`-only `include`.

**Version skew.** The baked doubles and both toolchains are pinned to the image
tag. The doubles are **quasi-public API** (§10): usable from extension tests, may
change between Navi versions. *Recommendation:* restate SPEC-5 §8 — pin the test
image tag to the exact `navi-hey` version the deployment runs `FROM`, and re-run
the suite on every bump.

---

## 4. Backend harness

**Loading the extension module.** A backend spec `import`s its target module
directly by relative path from `tests/backend/` into `src/backend/`, reads the
exported `{ method, path, handler }` descriptors, and drives the handler exactly
as Navi's own handler specs do — see
`source/spec/lib/server/handlers/LinksHandler_spec.js`: a hand-rolled
`res = { json: jasmine.createSpy('json') }`, `new Handler(req, res).handle()`, and
`expect(res.json).toHaveBeenCalledWith(...)`. Handlers that take constructor
extras can be driven through `HandlerConfig` the same way the stock specs do.

**`navi-hey/extension` resolution under test.** The module under test does
`import { RequestHandler } from 'navi-hey/extension'`. For that to resolve when
the file is imported from the mounted folder, the test image carries the **same**
`/navi/node_modules/navi-hey` symlink SPEC-5 §1 specifies for the runtime
container. *Recommendation:* the image adds that symlink (and the
`navi-hey/testing` doubles subpath, §10) so `src/backend/*.js` resolves
identically under test and in production — "what you test is what runs".

**Navi test doubles available to backend specs.** The curated subset of
`source/spec/support/{factories,dummies,utils}` promoted in §10, reachable via a
stable specifier (`navi-hey/testing`). Keep the set **minimal and documented** —
request/response spy builders, a `Logger` silencer — not the whole tree, and not
anything wired to Navi internals (`NamespaceMap`, the registries).

**Run command.** `npx jasmine` with the baked backend `jasmine.json`
(`spec_dir` = the mounted `tests/backend`). In the dedicated image this is the
`backend` subcommand of the default `CMD` (§6).

**Recommendation.** Backend extension specs are **plain Jasmine** — no jsdom, no
`--import` loader. They import from `src/backend/`, fake `req` / `res` with
`jasmine.createSpy`, instantiate the handler directly, and rely only on what
`RouteRegister` guarantees (sync `GET` `handle()`, awaited `PATCH`/`POST`, the
`ConflictError`/`ForbiddenError`/`NotFoundError` → status mapping). They may pull
baked doubles from `navi-hey/testing`.

---

## 5. Frontend harness

**Reused support files.** The image bakes `frontend/spec/support/`'s four files
at a fixed path:

| File | Role |
|---|---|
| `loader.js` | registers `transform_hooks.js` via `node:module` `register()` |
| `transform_hooks.js` | esbuild `jsx: 'automatic'` transform for `.jsx`; CSS/SCSS/Sass/Less imports stubbed to `export default {}` |
| `dom.js` | Jasmine `helper` — installs jsdom globals (`window`, `document`, …, `IS_REACT_ACT_ENVIRONMENT`) and exports `useContainer()` |
| `fetch.js` | `mockFetchSuccess(data)` / `mockFetchFailure(status)` — `describe`-level `spyOn(globalThis, 'fetch')` |

The baked frontend `jasmine.json` sets `helpers: ["<baked>/support/dom.js"]` and
is run as
`node --import <baked>/support/loader.js node_modules/.bin/jasmine` — identical
mechanics to `frontend/package.json`'s `spec` script.

**What a frontend extension spec looks like** — modelled on
`frontend/spec/components/StatsHeader_spec.js`:

- `import descriptors from '../../src/frontend/entry.js'` (or the page `.jsx`
  directly);
- `const state = useContainer();` at `describe` level;
- render with `act`:
  `await act(async () => state.root.render(createElement(MemoryRouter, null, createElement(Page))))`;
- mock the API with `spyOn(globalThis, 'fetch')` or the `mockFetchSuccess` /
  `mockFetchFailure` helpers from `support/fetch.js`;
- assert on `state.container.textContent` / `state.container.querySelector(...)`.

**Single React instance under test.** There is no host import map in the test
process; the spec resolves `react` / `react-dom` / `react-router-dom` from the
**image's** baked `frontend/node_modules`, so `useContainer`'s `createRoot` and
the extension component share one React. *Recommendation:* the image pins the same
React / React-Router major.minor the published SPA ships (restated from SPEC-4
§ Single React instance / SPEC-5 §8.1), and the author's devDependencies match
the image tag.

**`.jsx` / CSS.** Handled by `transform_hooks.js` — extension pages that
`import './OrdersPage.css'` load under test unchanged, and `.jsx` needs no
explicit React import.

**Run command.**
`node --import <baked>/support/loader.js node_modules/.bin/jasmine` with the baked
frontend `jasmine.json` (`spec_dir` = the mounted `tests/frontend`); the
`frontend` subcommand of the image's default `CMD` (§6).

**Recommendation.** Reuse `support/{loader,transform_hooks,dom,fetch}.js`
**as-is** — a documented, frozen subset, no fork. The author writes specs in the
exact `useContainer` + `spyOn(globalThis, 'fetch')` style used across
`frontend/spec/components/`.

---

## 6. Dedicated extension test image

Modelled explicitly on Tent's `darthjee/tent-test` (see
`~/messages/extension.md`): production stays lean, the toolchain lives only where
tests run, and both images expose the extension seam at the **same** path so what
you test is what runs.

**Placement.** A new `dockerfiles/<name>/Dockerfile`, a sibling of
`dockerfiles/production_navi_hey/`. *Recommendation:* name it **`navi-hey-test`**
(published as `darthjee/navi-hey-test`), matching the `navi-hey` package /
`darthjee/navi` image family — flagged as IMPL-6's final call.

**Base.** `FROM darthjee/node:0.2.1` like the dev images, reusing the
`yarn_builder.sh` cache-warm pattern from `dockerfiles/dev_navi_hey/`.
*Recommendation:* IMPL-6 decides whether to first extract a shared
`dev_navi_hey-base` layer so this image and the internal `navi:dev` share an
identical Node build (Tent's `dev_tent-base` parity insight) — desirable but not
required by this spec.

**What it bakes in.**

- Navi `source/` + its full `devDependencies` (jasmine, c8, eslint), so
  `npx jasmine` and `eslint` run.
- Navi `frontend/` + its full `devDependencies` (jasmine, jsdom, esbuild, c8).
- `frontend/spec/support/{loader,transform_hooks,dom,fetch}.js` at a fixed path.
- The promoted `source/spec/support/*` doubles (§10) at a fixed path, exposed as
  the `navi-hey/testing` subpath.
- Default backend and frontend `jasmine.json` whose `spec_dir` points at the
  mounted `tests/backend` / `tests/frontend` (§3), plus a `c8` config with
  `include: ["src/**/*.js", "src/**/*.jsx"]`.
- The `/navi/node_modules/navi-hey` symlink (SPEC-5 §1) so `navi-hey/extension`
  and `navi-hey/testing` resolve from the mounted spec files.

**One image, two subcommands — not two images.** *Recommendation:* a single
image with a small entrypoint dispatching `backend` / `frontend` / `all`
(default `all`), plus `lint`, `sh`, and an `--coverage` pass-through. This halves
the release matrix; the two suites still run as **separate Jasmine processes**
internally (§3).

**Mounts.** The author bind-mounts:

- their `src/` — the pre-build extension source the specs import;
- their `tests/` — the spec tree `spec_dir` points at;
- *optionally* their built `dist/` at `/navi/extensions` — the same volume
  production uses — for an integration/parity check.

`config/menu.yml` is not needed for unit tests.

```bash
docker run --rm \
  -v "$PWD/src:/work/src:ro" \
  -v "$PWD/tests:/work/tests:ro" \
  darthjee/navi-hey-test:<navi-tag>
```

```yaml
# docker-compose.yml (in the extension author's repo)
services:
  extension_tests:
    image: darthjee/navi-hey-test:<navi-tag>
    volumes:
      - ./src:/work/src:ro
      - ./tests:/work/tests:ro
      # - ./dist:/navi/extensions:ro   # optional parity check
```

**Default command.** No arguments ⇒ the baked config runs the author's backend
and frontend suites immediately (Tent's `CMD ["vendor/bin/phpunit"]` posture).
Overridable: `… backend`, `… frontend`, `… all --coverage`, `… lint`, `… sh`.

**Recommendation.** One `dockerfiles/navi-hey-test/` image `FROM darthjee/node`,
baking both toolchains + the reused support files + the `navi-hey/testing`
doubles + two `spec_dir`-mounted `jasmine.json` files, entrypoint-dispatched
`backend`/`frontend`/`all`/`lint`/`sh`, default `all`, built and released next to
the production image.

---

## 7. Config-driven runs

The parent issue's "their own Jasmine suite … runnable with Navi's tooling"
resolves to **the dedicated image's baked default command** — *not*:

- a new `yarn` script inside `source/` or `frontend/` (Navi's `package.json`
  files are untouched by this feature);
- a `Makefile` target in Navi's repo (`make tests` is for developing Navi
  itself).

The **author's own** project keeps a thin `package.json` `"test"` script that
just invokes the container, so `npm test` works locally and in CI without
assembling a toolchain:

```json
{
  "scripts": {
    "test": "docker compose run --rm extension_tests"
  }
}
```

**Recommendation.** Document both the `docker run` one-liner and the
`docker compose run --rm extension_tests` service; the **compose service is the
recommended default** (it names the mounts once and is what CI reuses, §8).

---

## 8. CI hook

A downstream project adds **one** CI job:

1. build (or pull) `darthjee/navi-hey-test:<navi-tag>`, pinned to the exact
   `navi-hey` version its deployment image runs `FROM`;
2. `docker compose run --rm extension_tests`.

Run it on **every PR**. On a Navi bump, this job is where SPEC-5 §8's upgrade
checklist is exercised — React / React-Router alignment, `navi-hey/extension`
still resolves, route-name collisions against new stock routes, restart-not-
reload.

**How Navi itself ships the image.** IMPL-6 wires the build/push into
`.circleci/config.yml` next to `build-and-release`: its own `:<git-tag>` +
`:latest` tags (plus the `-arm64` variant set), `requires:` the existing
`jasmine` / `jasmine-frontend` / `checks` / `checks-frontend` jobs, gated on
version tags — parallel to Tent's `build-and-release-tent-test-*` jobs and to the
existing `build-and-release-demo` / `build-and-release-demo-app` jobs. This is
guidance for IMPL-6, not a change here.

**Recommendation.** One downstream CI job — `docker compose run --rm
extension_tests` against a `navi-hey-test` image pinned to the deployment's Navi
tag, on every PR; Navi publishes that image from a version-tag-gated
`build-and-release-navi-hey-test` CircleCI job that `requires` the existing
test/lint jobs.

---

## 9. SPEC-5 re-alignment

SPEC-5 §7.2 / §9 defer to this issue and say "if SPEC-6 lands first, its
conventions win." Both worked-example tests, restated in Jasmine form, keeping
SPEC-5's fixed identifiers.

### `tests/backend/orders_spec.js`

Replaces `node:test` + `node:assert/strict`:

```js
import routes from '../../src/backend/orders.js';

describe('orders extension route', () => {
  const [route] = routes;
  let res;

  beforeEach(() => {
    res = { json: jasmine.createSpy('json') };
  });

  it('declares GET /ext/orders/summary.json', () => {
    expect(route.method).toBe('GET');
    expect(route.path).toBe('/ext/orders/summary.json');
  });

  describe('#handle', () => {
    beforeEach(() => {
      new route.handler({}, res).handle();
    });

    it('responds with the orders summary', () => {
      expect(res.json).toHaveBeenCalledWith(
        jasmine.objectContaining({ service: 'orders-extension' })
      );
    });

    it('includes a numeric pending count', () => {
      const [payload] = res.json.calls.mostRecent().args;
      expect(typeof payload.pending).toBe('number');
    });
  });
});
```

### `tests/frontend/orders_page_spec.jsx`

Replaces `vitest` + `@testing-library/react` with the Navi frontend style
(`useContainer` + `spyOn(globalThis, 'fetch')`):

```jsx
import { createElement } from 'react';
import { act } from 'react';
import { MemoryRouter } from 'react-router-dom';
import descriptors from '../../src/frontend/entry.js';
import { useContainer } from 'navi-hey/testing/dom.js';

const [{ component: OrdersPage, path, text }] = descriptors;

const flushAsync = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });

describe('OrdersPage', () => {
  const state = useContainer();

  it('is wired to /ext/orders with the Orders label', () => {
    expect(path).toBe('/ext/orders');
    expect(text).toBe('Orders');
  });

  describe('when the summary loads', () => {
    beforeEach(async () => {
      spyOn(globalThis, 'fetch').and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ pending: 3, service: 'orders-extension' }),
      }));

      await act(async () => {
        state.root.render(createElement(MemoryRouter, null, createElement(OrdersPage)));
      });
      await flushAsync();
    });

    it('renders the pending-order count', () => {
      expect(state.container.textContent).toContain('3 pending order(s)');
    });
  });
});
```

`mockFetchSuccess({ pending: 3, service: 'orders-extension' })` from
`navi-hey/testing/fetch.js` is the shorthand equivalent of the `spyOn` line.

### Follow-ups when this spec lands

- **Filenames** — `*.spec.js` / `*.spec.jsx` → `*_spec.js` / `*_spec.jsx`
  everywhere they appear (SPEC-5 §2, §7, §7.6).
- **IMPL-5 (#805)** — build `spec/fixtures/extensions/tests/` with these two
  Jasmine files; drop `vitest` / `@testing-library` / `node --test` from the
  fixture `package.json` devDependencies.
- **`docs/guides/navi/extending-navi.md`** — the condensed test retelling adopts
  the two Jasmine versions and the `navi-hey/testing` specifier.

---

## 10. Quasi-public test doubles

The image exposes a curated double set at the `navi-hey/testing` subpath. These
are **quasi-public API**: usable from extension tests, may change between Navi
tags (SPEC-5 §8's upgrade checklist covers the re-test).

### Backend — promoted from `source/spec/support/`

| Module | Import | Purpose |
|---|---|---|
| `utils/AxiosUtils.js` | `navi-hey/testing/axios.js` | `stubGet` / `stubPost` / `stubPatch` / `stubPut` (+ `*Rejection`) — stub outbound HTTP an extension handler makes |
| `utils/LoggerUtils.js` | `navi-hey/testing/logger.js` | `stubLoggerMethods()` / `stubConsoleMethods()` — silence `Logger` / `console` and/or assert on log calls |

Not promoted (tied to Navi internals — extensions must not depend on these):
`factories/*` (all `NamespaceMap` / registry / `Client` / `Resource` / job
builders), `dummies/*` (worker/job doubles for `deku-swarm`), the
registry-cleanup / namespace / job-registry utils, and the `fixtures/config/*`
YAML tree.

A hand-rolled `res = { json: jasmine.createSpy('json') }` (as in
`LinksHandler_spec.js`) is the whole request/response double the backend contract
needs — no builder is promoted for it; the doc shows the two lines inline (§4,
§9).

### Frontend — promoted from `frontend/spec/support/` as-is

| Module | Import | Purpose |
|---|---|---|
| `dom.js` | `navi-hey/testing/dom.js` | jsdom globals + `useContainer()` |
| `fetch.js` | `navi-hey/testing/fetch.js` | `mockFetchSuccess` / `mockFetchFailure` |

`loader.js` / `transform_hooks.js` are baked and wired by the image's frontend
`jasmine.json` (`--import` + `helpers`), not imported by author code.

### Import specifier

**Recommendation — a `navi-hey/testing` subpath**, exposed via
`source/package.json` `exports` and added to the `files` allowlist so it is
actually published, resolvable from the mounted folder via the same
`/navi/node_modules/navi-hey` symlink. Today `source/package.json` `files` is
`["bin", "lib", "static"]` and `frontend/` is unpublished — the mechanical
`exports` / `files` / packaging wiring (and how the frontend `support/*` files get
into the published tree or are shipped only inside the image) is **IMPL-6's
call**. This document fixes the specifier string and the promoted set only.

---

## 11. Deferred / out of scope

Mirrors the sibling specs' posture:

- **Extension npm dependencies not in the image** — extension code (and its
  specs) import only what the Navi image ships plus the extension's own bundled
  `.js`; installing arbitrary packages into the test image is deferred (SPEC-3
  already defers it for runtime).
- **Recursive / extra `tests/` subdirectories** beyond `backend/` and
  `frontend/`.
- **End-to-end / integration tests that boot a real Navi container** — the
  harness is unit-level; the optional `dist/` → `/navi/extensions` mount (§6) is
  a parity convenience, not a supported e2e mode.
- **Coverage-threshold gating** — `c8` runs with `check-coverage: false`, as Navi
  itself does.
- **A published standalone npm test-helper package** — the image is the delivery
  mechanism; `navi-hey/testing` is a subpath of the existing package, not a new
  one.
- **Multi-bundle / multi-extension repos** — the flat-folder contract supports
  them mechanically; harness guidance for them is not written here.

---

## 12. Handoff to IMPL-6

Mechanical decisions this document deliberately leaves to IMPL-6 (#806):

- final image name (`navi-hey-test` recommended) and Docker Hub repo;
- whether to extract a shared `dev_navi_hey-base` layer first;
- the exact baked paths for the reused `support/*` files, the doubles, and the
  two `jasmine.json` / `c8` configs;
- the exact host mount points for the author's `src/` and `tests/` (`/work/src`,
  `/work/tests` used illustratively above);
- the final promoted double set and its `source/package.json` `exports` / `files`
  wiring, plus how the frontend `support/*` files reach the published tree or
  ship only in the image;
- the `.circleci/config.yml` `build-and-release-navi-hey-test` job (tags, arch
  variants, `requires`).

---

## Cross-references

- **#794** — umbrella issue for the menu + extension tracks.
- [`extension-architecture.md`](extension-architecture.md) — SPEC-3 (#797) /
  SPEC-4 (#798); the container contract this harness targets and reuses verbatim.
- [`downstream-extension-workflow.md`](downstream-extension-workflow.md) —
  SPEC-5 (#799); the author's project layout, build tooling, image/compose
  wiring, and the worked example whose two tests §9 restates in Jasmine form.
- [`menu-configuration.md`](menu-configuration.md) — SPEC-1 (#795); the
  `config/menu.yml` file (not needed for unit tests).
- [`docs/guides/navi/extending-navi.md`](../../guides/navi/extending-navi.md) —
  the permanent user guide; inherits the durable test guidance when CLEAN-1
  deletes this file.
- **IMPL-5 (#805)** — turns SPEC-5 §7 into `spec/fixtures/extensions/`; must
  adopt §9's two Jasmine tests and the `navi-hey/testing` specifier.
- **IMPL-6 (#806)** — builds this harness and the `navi-hey-test` image from this
  document.
- **CLEAN-1 (#807)** — deletes this document once the feature ships, folding
  durable guidance into `extending-navi.md` / `docs/agents/web-server.md` /
  `docs/agents/frontend.md`.
- Tent's `darthjee/tent-test` (`~/messages/extension.md`) — the lean-production
  sibling-image pattern this design follows.

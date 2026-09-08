# Feature: Downstream-developer extension workflow

Part of #794 (**extension track**) — this is **SPEC-5**. Transient design
material: removed by **CLEAN-1 (#807)** once the feature ships, with the durable
parts already carried by the permanent user guide
[`docs/guides/navi/extending-navi.md`](../../guides/navi/extending-navi.md).

Where [`extension-architecture.md`](extension-architecture.md) (SPEC-3 / #797 and
SPEC-4 / #798) fixed the **container side** — what Navi scans, loads, and serves
from the mounted folder, and the shape of each descriptor — this document is the
**downstream developer's view**: the layout of *their own* extension project, the
build tooling that produces the mounted artefacts, how a backend route + a
frontend page + a menu entry compose into one deliverable and one
`docker-compose.yml`, and what to re-check when bumping the base Navi image.

It feeds **IMPL-5 (#805)** ("wire up the downstream extension workflow end to
end"), which lifts the [Worked example](#7-worked-example) directly into a real
fixture at `spec/fixtures/extensions/`.

---

## 1. Scope & relationship to SPEC-3 / SPEC-4

This document **does not re-decide** anything from
[`extension-architecture.md`](extension-architecture.md). It reuses, verbatim:

| Surface | Fixed by | Value |
|---|---|---|
| Enable flag | Shared contract | `NAVI_EXTENSIONS_ENABLED` — truthy (`1`/`true`/`yes`/`on`) to load; unset/empty/falsey ⇒ mechanism inert |
| Mount path | Shared contract | `NAVI_EXTENSIONS_DIR` — absolute container path; default `/navi/extensions` |
| Mounted layout | Shared contract | one volume, two reserved flat non-recursive subtrees `backend/` and `frontend/`; lexicographic load order; either subtree may be absent (info log, not an error) |
| Backend descriptor | Backend §Route declaration | `{ method, path, handler }` — `method` ∈ `GET`/`PATCH`/`POST` (case-insensitive); `path` non-empty, starts with `/`, no whitespace; `handler` a `RequestHandler` **subclass** (class, not instance) |
| Backend error mapping | Backend §Route declaration | `ConflictError`→409, `ForbiddenError`→403, `NotFoundError`→404, anything else→500; `express.json()` already applied; `GET` runs sync, `PATCH`/`POST` `handle()` is awaited |
| Frontend descriptor | Frontend §`frontend/` subtree layout | default-exports `[{ path, text, component }]` — `path` becomes a `<Route>` under the existing `HashRouter` (URL `#<path>`); `text` is the menu label; `component` a React component (may be `React.lazy`) |
| Served routes | Frontend §Discovery / §Asset serving (IMPL-4 / #804) | `GET /extensions/frontend.json` (manifest; `{ "bundles": [] }` when disabled), `GET /extensions/frontend/*path` (asset serving; 404 when disabled) |
| React sharing | Frontend §Single React instance | extension bundles build `react`, `react-dom`, `react-router-dom` as **externals**; the host `index.html` import map provides the single shared instance |
| Menu file | [`menu-configuration.md`](menu-configuration.md) (SPEC-1 / #795) | `config/menu.yml`, CLI `-m` / `--menu` (default `config/menu.yml`), prod env `NAVI_MENU`; entry shape `{ route, text[, hidden] }` |
| Menu auto-append | Frontend §Menu integration | extension `{ path, text }` pairs are appended to the menu **client-side** after the menu-file entries; the operator edits nothing |
| Reload limitation | Backend §Config plumbing & reload | extensions are fixed for the process lifetime; `PATCH /engine/reload` does not re-scan; changing extension code needs a container restart |
| Security posture | Backend §Security model | loading `backend/*.js` runs arbitrary code in the Navi process, full Node privileges, no sandbox; the opt-in flag + the operator-controlled volume are the entire trust model |

The container-side contract is **referenced, never copied**. If this document and
`extension-architecture.md` ever disagree, `extension-architecture.md` wins and
this file is the bug.

### Contract item this document settles

`extension-architecture.md`'s backend example imports the handler base class as
`'/home/node/app/lib/common/server/RequestHandler.js'` — the **dev-container**
path (bind-mounted source tree). The production image installs the package
globally (`npm install -g navi-hey@<version>`, see
`dockerfiles/production_navi_hey/Dockerfile`), so its `lib/` lives under the
global `node_modules` prefix, not `/home/node/app/lib/`. A hard-coded absolute
path is also fragile against any internal `lib/` reshuffle (cf. #813).

**Decision — the canonical specifier is the bare subpath:**

```js
import { RequestHandler } from 'navi-hey/extension';
```

Both this document and the user guide use that string **verbatim** in every
backend code sample. It is version-stable and survives internal reorganisation as
long as the package keeps the subpath export.

**Two mechanical follow-ups for IMPL-5 (#805)** — recorded here, *not* implemented
in this spec issue:

1. **Add an `exports` map to `source/package.json`** exposing the subpath:

   ```json
   "exports": {
     ".": "./index.js",
     "./extension": "./lib/common/server/RequestHandler.js"
   }
   ```

   Extend with `"./extension/secured"` → `lib/server/SecuredRequestHandler.js`
   if/when token wiring for extension handlers lands (currently deferred by
   SPEC-3).

2. **Make `navi-hey` resolvable from a file under `NAVI_EXTENSIONS_DIR/backend/`.**
   Node's ESM loader ignores `NODE_PATH`, and the operator's volume is mounted at
   `NAVI_EXTENSIONS_DIR`, so anything the image writes *inside* that path is
   shadowed by the bind mount. The production image therefore symlinks the global
   package one level **above** the mount point:

   ```dockerfile
   RUN mkdir -p /navi/node_modules \
    && ln -s "$(npm root -g)/navi-hey" /navi/node_modules/navi-hey
   ```

   Node resolving `navi-hey/extension` from `/navi/extensions/backend/orders.js`
   then walks `.../backend/node_modules` → `/navi/extensions/node_modules` →
   `/navi/node_modules` ✓. IMPL-5 may instead give `ExtensionRoutesLoader` an ESM
   resolve hook that aliases the specifier to the running package — either
   approach satisfies the contract; the fixed part is the **string**
   `navi-hey/extension`. The dev container adds the same symlink so the fixture's
   imports resolve identically under `spec/`.

---

## 2. Extension project layout

The downstream developer creates a small **standalone repo** (or a folder inside
their product repo). Nothing about it is Navi-specific except the two descriptor
contracts and the React-external build.

```
navi-orders-extension/
  package.json              # build script + dev deps (vite, react, test runner)
  vite.config.js            # library build, React/Router externalised
  config/
    menu.yml                # optional — one { route, text } line per extra route
  src/
    backend/
      orders.js             # ESM module, default-exports [{ method, path, handler }]
    frontend/
      OrdersPage.jsx        # the React page component (source)
      OrdersPage.css        # component styles (source)
      entry.js              # default-exports [{ path, text, component }]
  tests/
    backend/
      orders.spec.js        # exercises the handler in isolation
    frontend/
      orders-page.spec.jsx  # renders OrdersPage, asserts on output
  dist/                     # build output — this is what gets mounted
    backend/
      orders.js             # copied verbatim from src/backend (no transform)
    frontend/
      orders.js             # bundled ESM, React external
      orders.css            # emitted alongside the bundle
  Dockerfile                # optional — only for a derived image (see §6)
  docker-compose.yml        # wires dist/ into /navi/extensions
```

**Mapping onto the mounted folder.** The build produces exactly the
`extension-architecture.md` layout; `dist/` *is* the volume:

```
dist/                        →  /navi/extensions/          (bind-mounted)
  backend/orders.js          →    backend/orders.js        (plain ESM, no build)
  frontend/orders.js         →    frontend/orders.js       (pre-built ESM bundle)
  frontend/orders.css        →    frontend/orders.css      (optional sibling CSS)
```

- `backend/` is flat and non-recursive; every `*.js` directly under it is a
  candidate module. `src/backend/orders.js` is copied to `dist/backend/orders.js`
  **unchanged** — there is no backend build step (see §3).
- `frontend/` is flat and non-recursive; every `*.js` directly under it is a
  candidate bundle, with an optional same-basename `.css`. `src/frontend/*.jsx` +
  `entry.js` are **bundled** into a single `dist/frontend/orders.js` (see §4).
- Load / enumeration order for both subtrees is the lexicographic filename sort.

`config/menu.yml` is **not** part of the extensions volume — it is mounted
separately at the menu-file path (see §5).

---

## 3. Backend extension

**Contract (quoting SPEC-3, `extension-architecture.md` › Backend › Route
declaration & module contract):** each `backend/*.js` module default-exports (or
named-exports `routes`) an array of `{ method, path, handler }`:

| Field | Constraint |
|---|---|
| `method` | `GET` \| `PATCH` \| `POST` (case-insensitive). No other verbs in v1. |
| `path` | non-empty, starts with `/`, no whitespace. Express path syntax (`:param`, `*splat`) allowed. |
| `handler` | a `RequestHandler` **subclass** (class, not instance). Instantiated per request as `new handler(req, res)`, exactly like every stock handler. |

**Handler example** — uses the canonical import specifier settled in §1:

```js
// src/backend/orders.js  →  mounted at /navi/extensions/backend/orders.js
import { RequestHandler } from 'navi-hey/extension';

class OrdersSummaryHandler extends RequestHandler {
  constructor (_request, response) {
    super();
    this.response = response;
  }

  handle () {
    this.response.json({ pending: 3, service: 'orders-extension' });
  }
}

export default [
  { method: 'GET', path: '/ext/orders/summary.json', handler: OrdersSummaryHandler },
];
```

**What the handler inherits from `RouteRegister`** (identical to stock handlers —
extension authors rely on these and nothing more):

- `GET` `handle()` runs **synchronously**; `PATCH` / `POST` `handle()` is
  **`await`ed**, so it may be `async`.
- Throwing `ConflictError` → 409, `ForbiddenError` → 403, `NotFoundError` → 404
  (from `navi-hey/lib/exceptions/http/`); any other throw → 500 with
  `{ error: 'Internal Server Error' }`.
- The handler owns the response — it calls `res.json(...)` / `res.status(...)` /
  `res.send(...)` itself.
- `express.json()` body parsing is already applied, so `req.body` is populated
  for `PATCH` / `POST`.
- Extras are **public by default**. Wiring a configured token into an extension
  `SecuredRequestHandler` is deferred by SPEC-3; a v1 secured extra with no token
  rejects every request by design.

**No build step.** `backend/*.js` runs as-is in Navi's Node process — plain ESM,
`.js` extension, `import` only. It may import anything the Navi image ships plus
its own bundled `.js` siblings; it may **not** pull in npm dependencies that the
image does not already carry (deferred by SPEC-3). The "build" for `backend/` is a
straight copy of `src/backend/` into `dist/backend/`.

---

## 4. Frontend extension

**Contract (quoting SPEC-4, `extension-architecture.md` › Frontend › `frontend/`
subtree layout):** each `frontend/*.js` bundle default-exports an array of
`{ path, text, component }`:

| Field | Constraint |
|---|---|
| `path` | non-empty, starts with `/`, no whitespace. Becomes a `<Route path>` under the existing `HashRouter`; user-visible URL is `#<path>`. |
| `text` | non-empty. The menu label (auto-appended after menu-file entries — see §5). |
| `component` | a React component (function or class). May be `React.lazy(...)`. |

**Page component** (source):

```jsx
// src/frontend/OrdersPage.jsx
import { useEffect, useState } from 'react';
import './OrdersPage.css';

export default function OrdersPage () {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    fetch('/ext/orders/summary.json')
      .then((r) => r.json())
      .then(setSummary)
      .catch(() => setSummary({ error: true }));
  }, []);

  if (!summary) return <p className="orders-loading">Loading…</p>;
  if (summary.error) return <p className="orders-error">Unavailable</p>;
  return <p className="orders-summary">{summary.pending} pending order(s)</p>;
}
```

**Entry module** — the default export the mounted bundle must carry:

```js
// src/frontend/entry.js
import OrdersPage from './OrdersPage.jsx';

export default [
  { path: '/ext/orders', text: 'Orders', component: OrdersPage },
];
```

**Build — `vite build --lib` with React externalised.** The full copy-pasteable
config lives in the user guide
([`docs/guides/navi/extending-navi.md`](../../guides/navi/extending-navi.md) ›
"A frontend page"); it is **not** duplicated here. Its shape:

```js
// vite.config.js  (skeleton — see the guide for the complete file)
export default {
  build: {
    lib: { entry: 'src/frontend/entry.js', formats: ['es'], fileName: () => 'orders.js' },
    outDir: 'dist/frontend',
    rollupOptions: {
      external: ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime', 'react-router-dom'],
    },
  },
};
```

- The three React packages are **externals**, so `import { useState } from 'react'`
  in the bundle resolves — via the host `index.html` import map — to the single
  React instance the host already loaded. Bundling its own React would produce a
  second instance and break hooks / context / `<Routes>` matching the moment the
  component mounts.
- Output is a single ESM `dist/frontend/orders.js`. If the component imports CSS
  and the build emits `dist/frontend/orders.css`, Navi injects
  `<link rel="stylesheet" href="/extensions/frontend/orders.css">` when it loads
  the bundle (same basename = sibling CSS). The bundle may instead inline its CSS;
  the sibling file is a convenience, not a requirement.
- **The Navi SPA is never rebuilt.** Per SPEC-4, the running image carries no
  frontend toolchain; the pre-built bundle is mounted and discovered at SPA boot
  via `GET /extensions/frontend.json`.

---

## 5. Menu entry

The new route is reachable by URL as soon as its bundle loads; a menu entry makes
it **discoverable**.

**Auto-append (SPEC-4).** The SPA merges every extension `{ path, text }` into the
menu **client-side**, appended after the menu-file entries. A downstream developer
who does nothing still gets an **Orders** item in the menu dropdown.

**Explicit `config/menu.yml` entry** — per SPEC-1 (#795), to control position or
label:

```yaml
# config/menu.yml  — mounted at the menu-file path, NOT inside /navi/extensions
entries:
  - route: /ext/orders
    text: Orders
```

- Entry shape is `{ route, text[, hidden] }`; `route` starts with `/` (internal)
  or is an absolute `http(s)://` URL; `text` defaults to `route`.
- The stock `config/menu.yml` ships with Logs + Memory; operator entries are
  **appended** to those defaults (SPEC-1). So the menu here renders
  **Logs, Memory, Orders**.
- Levers from SPEC-4 › Menu integration:
  - **Reposition** — re-list `/ext/orders` in `menu.yml` at the desired position;
    SPEC-1's "duplicate `route`, first occurrence wins" keeps the file position
    and the auto-appended copy is skipped.
  - **Hide** — `{ route: /ext/orders, hidden: true }` drops the auto-appended
    entry (the route stays reachable by URL).
- The menu file and the extensions volume are **separate schemas**; neither
  validates the other. A menu entry pointing at a route that no extension
  registers is not an error — it renders as an ordinary link that 404s when
  clicked.

---

## 6. Image & compose

Two deployment shapes; **neither requires a frontend rebuild**.

### 6a. Pure bind-mount (recommended default)

Run the stock image unchanged; mount `dist/` as the extensions volume and
`config/menu.yml` as the menu file.

```yaml
# docker-compose.yml
services:
  navi:
    image: darthjee/navi-hey:latest
    environment:
      NAVI_EXTENSIONS_ENABLED: "true"
      # NAVI_EXTENSIONS_DIR defaults to /navi/extensions
      # NAVI_MENU defaults to the prod image's /navi/menu.yml
    volumes:
      - ./dist:/navi/extensions:ro
      - ./config/menu.yml:/navi/menu.yml:ro
    ports:
      - "3000:3000"
```

- `:ro` — Navi only ever reads the folder.
- The host folder is the operator's, matching the existing `docker_volumes/`
  convention in the repo's own `docker-compose.yml`.
- This is the whole workflow: build `dist/`, mount it, set one env var.

### 6b. Derived image

Only when the operator wants the extension **baked in** (immutable deploy
artefact, no volume to manage):

```dockerfile
# Dockerfile
FROM darthjee/navi-hey:<tag>

# COPY the built artefacts to the default mount point
COPY dist/ /navi/extensions/
COPY config/menu.yml /navi/menu.yml

ENV NAVI_EXTENSIONS_ENABLED=true
```

- `COPY dist/`, not `COPY src/` — the built bundle, never the source tree.
- Still **no rebuild of the Navi SPA**: the frontend bundle is a pre-built ESM
  file the running SPA discovers at boot, exactly as in the bind-mount case.
- Pin `<tag>` to an exact Navi version and run the [Upgrade checklist](#8-upgrade-checklist)
  when bumping it.
- A `docker-compose.yml` for the derived image just sets `image:` to the derived
  tag and drops the two `volumes:` lines.

**When a rebuild *is* required:** only the extension developer's own
`vite build` (frontend) — re-run whenever `src/frontend/**` changes. The backend
subtree never needs a build. Navi itself is never rebuilt in either shape.

---

## 7. Worked example

The complete, concrete deliverable. **IMPL-5 (#805) lifts this verbatim into
`spec/fixtures/extensions/`** — the canonical identifiers below (`orders`,
`/ext/orders`, `/ext/orders/summary.json`, `OrdersSummaryHandler`, `OrdersPage`,
menu label `Orders`, `orders.spec.js`, `orders-page.spec.jsx`) must match that
fixture exactly, and must match the user guide's condensed retelling.

### 7.1 Files

**`src/backend/orders.js`** — see §3 (`OrdersSummaryHandler`, `GET
/ext/orders/summary.json`).

**`src/frontend/OrdersPage.jsx`**, **`src/frontend/OrdersPage.css`**,
**`src/frontend/entry.js`** — see §4 (`OrdersPage`, route `/ext/orders`, label
`Orders`).

**`src/frontend/OrdersPage.css`:**

```css
.orders-summary { font-weight: 600; }
.orders-error   { color: var(--bs-danger, #dc3545); }
```

**`config/menu.yml`:**

```yaml
entries:
  - route: /ext/orders
    text: Orders
```

**`vite.config.js`** — the skeleton in §4; full version in the user guide.

**`package.json`** (extension project):

```json
{
  "name": "navi-orders-extension",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "vite build && mkdir -p dist/backend && cp src/backend/*.js dist/backend/",
    "test": "node --test tests/backend && vitest run tests/frontend"
  },
  "devDependencies": {
    "react": "<match base image>",
    "react-dom": "<match base image>",
    "react-router-dom": "<match base image>",
    "vite": "^5",
    "vitest": "^2",
    "@testing-library/react": "^16"
  }
}
```

The `build` script is `vite build` (frontend bundle) **plus** a plain copy of
`src/backend/*.js` into `dist/backend/` — no transform.

### 7.2 The two example tests

Consistent with SPEC-6 (#800)'s direction: **one backend test, one frontend
test**. This document shows only the two examples; the full downstream test
*harness* (runner wiring, `spec/`-tree isolation, fixtures plumbing) is SPEC-6's,
not SPEC-5's. If SPEC-6 lands first, its conventions win and these examples are
re-aligned; otherwise these set the initial shape.

**`tests/backend/orders.spec.js`** — instantiate the handler with a fake
`response`, call `handle()`, assert on what it wrote:

```js
import assert from 'node:assert/strict';
import { test } from 'node:test';
import routes from '../../src/backend/orders.js';

test('GET /ext/orders/summary.json returns a JSON summary', () => {
  const [route] = routes;
  assert.equal(route.method, 'GET');
  assert.equal(route.path, '/ext/orders/summary.json');

  let body;
  const response = { json: (payload) => { body = payload; } };
  new route.handler({}, response).handle();

  assert.equal(body.service, 'orders-extension');
  assert.equal(typeof body.pending, 'number');
});
```

**`tests/frontend/orders-page.spec.jsx`** — render the component, assert on
output (mock `fetch`):

```jsx
import { render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import descriptors from '../../src/frontend/entry.js';

test('OrdersPage renders the pending-order count', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    json: () => Promise.resolve({ pending: 3, service: 'orders-extension' }),
  }));

  const { component: OrdersPage, path, text } = descriptors[0];
  expect(path).toBe('/ext/orders');
  expect(text).toBe('Orders');

  render(<OrdersPage />);
  expect(await screen.findByText('3 pending order(s)')).toBeInTheDocument();
});
```

### 7.3 Built / mounted tree

After `npm run build`:

```
dist/
  backend/
    orders.js
  frontend/
    orders.js          # bundled, React external
    orders.css         # emitted from OrdersPage.css import
```

### 7.4 Compose

```yaml
services:
  navi:
    image: darthjee/navi-hey:latest
    environment:
      NAVI_EXTENSIONS_ENABLED: "true"
    volumes:
      - ./dist:/navi/extensions:ro
      - ./config/menu.yml:/navi/menu.yml:ro
    ports:
      - "3000:3000"
```

### 7.5 Result at runtime

1. On server start `ExtensionRoutesLoader` reads `/navi/extensions/backend/`,
   imports `orders.js`, registers `GET /ext/orders/summary.json`, and logs the
   boot audit line.
2. On SPA boot the dashboard fetches `/extensions/frontend.json`, lazy-loads
   `/extensions/frontend/orders.js`, mounts `#/ext/orders` inside the stock
   layout, injects `orders.css`, and appends **Orders** to the menu.
3. With `NAVI_EXTENSIONS_ENABLED` unset the same image serves the same SPA with
   no `/ext/orders` route, no `/ext/orders/summary.json`, and no menu entry.

### 7.6 IMPL-5 fixture mapping

IMPL-5 (#805) builds `spec/fixtures/extensions/` from the above:

```
spec/fixtures/extensions/
  src/
    backend/orders.js
    frontend/OrdersPage.jsx
    frontend/OrdersPage.css
    frontend/entry.js
  config/menu.yml
  vite.config.js
  package.json
  tests/
    backend/orders.spec.js
    frontend/orders-page.spec.jsx
  dist/                       # committed built output, or produced by a fixture build step
    backend/orders.js
    frontend/orders.js
    frontend/orders.css
```

Whether `dist/` is committed or generated by a `spec` setup step is IMPL-5's
call; the source-side identifiers are fixed here.

---

## 8. Upgrade checklist

Run this when bumping `FROM darthjee/navi-hey:<tag>` (or the pulled `image:` tag):

1. **React / React-Router version alignment.** Read the new image's
   `index.html` import map (or its `frontend/package.json`) and set the extension
   project's `react` / `react-dom` / `react-router-dom` **devDependencies** to the
   same major/minor, then rebuild the frontend bundle. A mismatch that changes the
   ESM export surface breaks the externalised imports at runtime.
2. **Handler base-class import specifier unchanged.** Confirm
   `import { RequestHandler } from 'navi-hey/extension'` still resolves in the new
   image (the `exports` subpath and the `/navi/node_modules/navi-hey` symlink from
   §1's follow-ups are both still present). No `src/backend/**` change is expected
   between Navi versions.
3. **Route-name collisions.** Diff your extension's `method + path` set against the
   new image's stock routes. Per SPEC-3, **stock always wins** — a colliding extra
   is skipped with a `Logger.warn` and silently disappears. Rename the extra if a
   new stock route now shadows it.
4. **Re-run the extension's own tests** (§7.2) against the new image — ideally in
   CI, against a container built `FROM` the new tag.
5. **Restart, don't reload.** Extensions are fixed for the process lifetime;
   `PATCH /engine/reload` does not re-scan `NAVI_EXTENSIONS_DIR`. Deploying new
   extension code — or a new base image — means a **container restart**.

---

## 9. Deferred / out of scope

- **The downstream test *harness*.** SPEC-6 (#800) owns the runner wiring,
  `spec/`-tree isolation, and fixture plumbing for downstream extension tests.
  This document shows only the two example tests in §7.2 and defers everything
  else about testing to SPEC-6.
- **Everything SPEC-3 / SPEC-4 already deferred:** recursive `backend/` /
  `frontend/` subdirectories; HTTP verbs beyond GET/PATCH/POST; wiring a
  configured token into extension `SecuredRequestHandler` subclasses; hot-reload /
  re-scan of extensions; any sandboxing / permission model / importable-module
  allow-list; a manifest file or YAML key for routes; npm-dependency installation
  for extension code (extensions import only what the Navi image ships plus their
  own bundled `.js`); a build-time SPA-rebuild path or SSR for extensions;
  extension-controlled menu placement beyond `hidden` / re-list.
- **Multi-extension packaging** (one repo shipping several unrelated bundles with
  independent versioning) — the flat-folder contract supports it mechanically;
  guidance for it is not written here.

---

## Cross-references

- **#794** — umbrella issue for the menu + extension tracks.
- [`extension-architecture.md`](extension-architecture.md) — SPEC-3 (#797) /
  SPEC-4 (#798); the container-side contract this document reuses verbatim. Its
  security warning, reload limitation, and external-React build snippet now have
  their permanent home in
  [`docs/guides/navi/extending-navi.md`](../../guides/navi/extending-navi.md).
- [`menu-configuration.md`](menu-configuration.md) — SPEC-1 (#795); the
  `config/menu.yml` file, `-m` / `--menu` option, `NAVI_MENU` env var, and
  `{ route, text }` entry shape used in §5.
- [`docs/guides/navi/extending-navi.md`](../../guides/navi/extending-navi.md) —
  the permanent user-facing guide (SPEC-5 deliverable 2): security warning, reload
  limitation, copy-pasteable external-React `vite build --lib` config, and an
  operator-facing condensed walkthrough of §7.
- **IMPL-3 (#803) / IMPL-4 (#804)** — implement the backend and frontend loaders
  this workflow targets.
- **IMPL-5 (#805)** — turns §7 into the `spec/fixtures/extensions/` fixture and
  performs the two `source/package.json` / Dockerfile follow-ups recorded in §1.
- [`downstream-extension-tests.md`](downstream-extension-tests.md) — **SPEC-6
  (#800)**; the downstream Jasmine test harness and its dedicated image.
  Supersedes §7.2's `node --test` / `vitest` examples with Jasmine versions and
  renames the spec files to `*_spec.js` / `*_spec.jsx`.
- **CLEAN-1 (#807)** — deletes this document once the feature ships.
</content>
</invoke>

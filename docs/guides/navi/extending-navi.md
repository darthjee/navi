# Extending Navi with Your Own Routes and Pages

Extensions let you add your own **backend routes** and **frontend pages** on top of the stock `darthjee/navi-hey` image without forking it or rebuilding the Navi SPA. You write a small, standalone project, build it into a `dist/` folder, mount that folder into the container, and flip one environment variable. The mechanism is fully opt-in and off by default: an image with `NAVI_EXTENSIONS_ENABLED` unset serves exactly the stock dashboard and API.

> **Security warning.** Loading an extension runs **arbitrary JavaScript, mounted into the container, in the same process as Navi with no isolation** — full Node privileges, no sandbox, no permission model. The opt-in flag and the operator-controlled volume are the entire trust model. Only mount code you wrote or audited, from a volume you control.

This page is the operator-facing walkthrough. For the container-side loader mechanics (what Navi scans, how descriptors are validated, collision handling) and the downstream test harness, see the extension architecture design doc: [`downstream-extension-workflow.md`](../../agents/future/downstream-extension-workflow.md).

### When to use extensions

Reach for an extension when you want the stock Navi image plus a little of your own surface — a JSON endpoint that reports on your system, a dashboard page that renders it, a menu link to reach it — and you don't want to maintain a fork or a full rebuild pipeline just for that. Anything larger (custom auth, bundled npm dependencies the image doesn't ship, a rebuilt SPA) is out of scope; extensions deliberately stay small.

### Enabling extensions

Three things switch the mechanism on:

| Setting | Value |
|---------|-------|
| `NAVI_EXTENSIONS_ENABLED` | Truthy (`1` / `true` / `yes` / `on`) to load extensions. Unset, empty, or falsey leaves the mechanism inert. |
| `NAVI_EXTENSIONS_DIR` | Absolute container path Navi scans for extensions. Defaults to `/navi/extensions`. Mount your built folder here (or point this elsewhere). |
| `NAVI_MENU` (CLI `-m` / `--menu`) | Path to the menu file. Defaults to `config/menu.yml`; the production image defaults it to `/navi/menu.yml`. Mount your own menu file here if you want to control menu position or labels. |

A `docker-compose.yml` for the recommended pure bind-mount shape:

```yaml
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

`:ro` — Navi only ever reads the folder. The whole workflow is: build `dist/`, mount it, set one env var.

### Folder layout

The mounted folder has exactly two reserved subtrees, both **flat and non-recursive**:

```
/navi/extensions/           (this is your build output, not your source tree)
  backend/
    orders.js               # every *.js here is a route module
  frontend/
    orders.js               # every *.js here is a page bundle
    orders.css              # optional same-basename sibling stylesheet
```

- Files are loaded in **lexicographic filename order** within each subtree.
- Either subtree may be **absent** — that is an info-level log line, not an error. A backend-only or frontend-only extension is fine.
- Only files **directly under** `backend/` and `frontend/` are considered; nested directories are ignored.

### A backend route

Each `backend/*.js` module is an ESM file that default-exports (or named-exports `routes`) an array of `{ method, path, handler }` descriptors:

| Field | Constraint |
|-------|------------|
| `method` | `GET`, `PATCH`, or `POST` (case-insensitive). No other verbs. |
| `path` | Non-empty, starts with `/`, no whitespace. Express path syntax (`:param`, `*splat`) is allowed. |
| `handler` | A `RequestHandler` **subclass** — the class itself, not an instance. Navi instantiates it per request as `new handler(req, res)`, exactly like every stock handler. |

The handler base class is imported from the `navi-hey/extension` subpath — use this specifier verbatim; it is version-stable and survives internal reorganisation of the package:

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

What the handler inherits, identical to every stock handler:

- `GET` `handle()` runs **synchronously**; `PATCH` / `POST` `handle()` is **`await`ed**, so it may be `async`.
- Throwing `ConflictError` → 409, `ForbiddenError` → 403, `NotFoundError` → 404; any other throw → 500 with `{ error: 'Internal Server Error' }`.
- The handler owns the response — it calls `res.json(...)` / `res.status(...)` / `res.send(...)` itself.
- `express.json()` body parsing is already applied, so `req.body` is populated for `PATCH` / `POST`.
- Extension routes are **public** — there is no token wiring for them.

**No build step for the backend.** `backend/*.js` runs as-is in Navi's Node process: plain ESM, `.js` extension, `import` only. It may import anything the Navi image ships plus its own bundled `.js` siblings — it may **not** pull in npm packages the image does not already carry. The "build" for `backend/` is a straight copy of your source files into `dist/backend/`.

### A frontend page

Each `frontend/*.js` bundle default-exports an array of `{ path, text, component }` descriptors:

| Field | Constraint |
|-------|------------|
| `path` | Non-empty, starts with `/`, no whitespace. Becomes a `<Route path>` under the dashboard's existing `HashRouter`; the user-visible URL is `#<path>`. |
| `text` | Non-empty. The menu label (auto-appended to the menu — see below). |
| `component` | A React component (function or class). May be `React.lazy(...)`. |

The page component and the entry module (source):

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

```js
// src/frontend/entry.js
import OrdersPage from './OrdersPage.jsx';

export default [
  { path: '/ext/orders', text: 'Orders', component: OrdersPage },
];
```

**Build the bundle with React externalised.** The running Navi image carries **no frontend toolchain** and its SPA is **never rebuilt** — you ship a pre-built ESM bundle that the dashboard discovers at boot via `GET /extensions/frontend.json` and loads from `GET /extensions/frontend/*path` (both return an empty manifest / 404 when extensions are disabled).

React, React-DOM, and React-Router **must be externals**. The host `index.html` already loaded exactly one copy of each and exposes them through its import map; bundling your own would create a second React instance and break hooks, context, and `<Routes>` matching the moment your component mounts.

The complete, copy-pasteable `vite build --lib` config:

```js
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Emit a library bundle, not an app with its own index.html.
    lib: {
      entry: 'src/frontend/entry.js',
      formats: ['es'],           // Navi loads extension bundles as ESM
      fileName: () => 'orders.js',
    },
    outDir: 'dist/frontend',
    emptyOutDir: true,
    rollupOptions: {
      // Never bundle React / React-Router — the host SPA already loaded exactly
      // one copy and exposes it through the index.html import map.
      external: [
        'react',
        'react-dom',
        'react-dom/client',
        'react/jsx-runtime',
        'react-router-dom',
      ],
    },
  },
});
```

The build produces a single ESM file, `dist/frontend/orders.js`. If your component imports CSS and the build emits `dist/frontend/orders.css` (**same basename** as the bundle), Navi injects `<link rel="stylesheet" href="/extensions/frontend/orders.css">` when it loads the bundle. The sibling `.css` file is a convenience — the bundle may inline its styles instead.

### A menu entry

Your route is reachable by URL (`#/ext/orders`) as soon as its bundle loads. A menu entry makes it **discoverable**.

**You get one for free.** The SPA merges every extension `{ path, text }` pair into the menu **client-side**, appended after the menu-file entries. The stock menu ships with **Logs** and **Memory**, so doing nothing renders **Logs, Memory, Orders**. The operator edits nothing.

To control position or label, add an explicit entry to `config/menu.yml`:

```yaml
# config/menu.yml  — mounted at the menu-file path, NOT inside /navi/extensions
entries:
  - route: /ext/orders
    text: Orders
```

- Entry shape is `{ route, text[, hidden] }`. `route` starts with `/` (internal) or is an absolute `http(s)://` URL; `text` defaults to `route`.
- Operator entries are **appended** to the stock Logs + Memory defaults.
- **Reposition** — list `/ext/orders` in `menu.yml` at the position you want. A duplicate `route` keeps its first occurrence, so the file entry wins and the auto-appended copy is skipped.
- **Hide** — `{ route: /ext/orders, hidden: true }` drops the auto-appended entry; the route stays reachable by URL.
- The menu file and the extensions volume are **separate schemas** — neither validates the other. A menu entry pointing at a route no extension registers renders as an ordinary link that 404s when clicked.

### Worked example

One backend route, one frontend page, one menu entry — the complete deliverable.

**`src/backend/orders.js`** — the `OrdersSummaryHandler` serving `GET /ext/orders/summary.json`, exactly as shown in [A backend route](#a-backend-route).

**`src/frontend/OrdersPage.jsx`** and **`src/frontend/entry.js`** — the `OrdersPage` component and its descriptor (route `/ext/orders`, label `Orders`), exactly as shown in [A frontend page](#a-frontend-page).

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

**`vite.config.js`** — the complete file from [A frontend page](#a-frontend-page).

**`package.json`** (extension project):

```json
{
  "name": "navi-orders-extension",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "vite build && mkdir -p dist/backend && cp src/backend/*.js dist/backend/"
  },
  "devDependencies": {
    "react": "<match base image>",
    "react-dom": "<match base image>",
    "react-router-dom": "<match base image>",
    "vite": "^5",
    "@vitejs/plugin-react": "^4"
  }
}
```

The `build` script is `vite build` (the frontend bundle) **plus** a plain copy of `src/backend/*.js` into `dist/backend/` — no transform on the backend files.

**Built / mounted tree** after `npm run build`:

```
dist/
  backend/
    orders.js          # copied verbatim from src/backend/
  frontend/
    orders.js          # bundled ESM, React external
    orders.css         # emitted from the OrdersPage.css import
```

**`docker-compose.yml`:**

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

**At runtime:**

1. On server start Navi reads `/navi/extensions/backend/`, imports `orders.js`, registers `GET /ext/orders/summary.json`, and logs the boot audit line.
2. On SPA boot the dashboard fetches `/extensions/frontend.json`, lazy-loads `/extensions/frontend/orders.js`, mounts `#/ext/orders` inside the stock layout, injects `orders.css`, and appends **Orders** to the menu.
3. With `NAVI_EXTENSIONS_ENABLED` unset the same image serves the same SPA with no `/ext/orders` route, no `/ext/orders/summary.json`, and no menu entry.

For testing your extension in isolation — one backend test exercising the handler, one frontend test rendering the component — see the design doc's worked example and the downstream test harness referenced from [`downstream-extension-workflow.md`](../../agents/future/downstream-extension-workflow.md).

### Baking the extension into a derived image

Instead of a bind-mount you can build a derived image with the extension baked in (immutable deploy artefact, no volume to manage):

```dockerfile
FROM darthjee/navi-hey:<tag>

# COPY the built artefacts to the default mount point — never the source tree.
COPY dist/ /navi/extensions/
COPY config/menu.yml /navi/menu.yml

ENV NAVI_EXTENSIONS_ENABLED=true
```

The Navi SPA is still **not** rebuilt — the frontend bundle is the same pre-built ESM file the SPA discovers at boot. Pin `<tag>` to an exact Navi version and run the upgrade checklist below when you bump it. A `docker-compose.yml` for this shape just sets `image:` to the derived tag and drops the two `volumes:` lines.

### Reload limitation

Extensions are **fixed for the process lifetime**. Changing them — new backend code, a new frontend bundle, or a new base image — requires a **container restart**. `PATCH /engine/reload` re-reads only the warm-up configuration; it does **not** re-scan `NAVI_EXTENSIONS_DIR` and does not affect loaded extensions.

### Upgrading the base image

Run this checklist when bumping `FROM darthjee/navi-hey:<tag>` or the pulled `image:` tag:

1. **React / React-Router version alignment.** Read the new image's `index.html` import map (or its `frontend/package.json`) and set your extension project's `react` / `react-dom` / `react-router-dom` devDependencies to the same major/minor, then rebuild the frontend bundle. A mismatch that changes the ESM export surface breaks the externalised imports at runtime.
2. **Handler import specifier unchanged.** Confirm `import { RequestHandler } from 'navi-hey/extension'` still resolves in the new image. No `src/backend/**` change is expected between Navi versions.
3. **Route-name collisions.** Diff your extension's `method + path` set against the new image's stock routes. Stock always wins — a colliding extra is skipped with a warning and silently disappears. Rename the extra if a new stock route now shadows it.
4. **Re-run your extension's own tests** against the new image, ideally in CI, against a container built `FROM` the new tag.
5. **Restart, don't reload.** Deploying new extension code — or a new base image — means a container restart, not `PATCH /engine/reload`.

[← Back to How to Use Navi](../how_to_use_navi.md)

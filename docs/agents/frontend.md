# Frontend

The frontend is a React SPA that provides a real-time monitoring dashboard for Navi's job queues and worker pool. Built with Vite and served by the main application's web server from `source/static/`.

## Technology stack

| Tool | Version | Role |
|------|---------|------|
| React | 19 | UI framework |
| React Router DOM | 7 | Client-side routing (hash-based) |
| Vite | 7 | Build tool and dev server |
| Bootstrap | 5.3 | Styles |
| React Bootstrap | 2.10 | Bootstrap component wrappers |
| Jasmine + jsdom | — | Test framework |
| ESLint | 9 | Linting |
| c8 | — | Coverage |

## Source layout

> [`frontend/src/README.md`](../../frontend/src/README.md) is a one-line index of `frontend/src/`'s immediate children; this page is the full reference.

```
frontend/
├── src/
│   ├── main.jsx                  # React entrypoint; async bootstrap (awaits loadExtensions) then router setup
│   ├── clients/                  # API client modules (pure fetch)
│   │   ├── StatsClient.js        # GET /stats.json (includes emissions block)
│   │   ├── JobsClient.js         # GET /jobs/:status.json
│   │   ├── JobClient.js          # GET /job/:id.json
│   │   ├── EngineClient.js       # GET /engine/status + PATCH /engine/*
│   │   ├── MemoryStatusClient.js # GET /memory/status.json
│   │   ├── EmissionsClient.js    # GET /emissions.json (?last_id= cursor)
│   │   ├── ExtractionsClient.js  # GET /extractions.json (?last_id= cursor)
│   │   ├── LinksClient.js        # GET /links.json (external links dropdown)
│   │   └── MenuClient.js         # GET /menu.json → { entries, hidden } (internal nav dropdown; hidden filters extension menu entries)
│   ├── extensions/               # Runtime loading of externally built extension bundles
│   │   ├── loadExtensions.js     # fetch /extensions/frontend.json → import() each bundle → validate { path, text, component }
│   │   └── ExtensionErrorBoundary.jsx  # inline-alert boundary around the extension route subtree
│   ├── constants/
│   │   └── jobStatus.js          # Status → Bootstrap color variant mapping
│   └── components/
│       ├── pages/                # Full page/route-level components
│       │   ├── Layout.jsx
│       │   ├── Jobs.jsx
│       │   ├── Job.jsx
│       │   ├── LogsPage.jsx
│       │   ├── MemoryStatus.jsx
│       │   ├── MemoryStatus.css
│       │   ├── Emissions.jsx
│       │   ├── Extractions.jsx
│       │   ├── controllers/      # Data/logic controller classes
│       │   │   ├── MemoryStatusController.jsx
│       │   │   ├── EmissionsController.jsx
│       │   │   └── ExtractionsController.jsx
│       │   └── helpers/          # HTML rendering helpers
│       │       ├── MemoryStatusHelper.jsx
│       │       ├── EmissionsHelper.jsx
│       │       └── ExtractionsHelper.jsx
│       └── elements/             # Reusable UI widgets
│           ├── EngineControls.jsx
│           ├── StatsHeader.jsx    # workers + jobs + emissions groups
│           ├── StatsDisplay.jsx
│           ├── JobDetails.jsx
│           ├── ReadyCountdown.jsx
│           ├── Logs.jsx
│           ├── LinksMenu.jsx      # external links dropdown (GET /links.json)
│           ├── LinksDropdown.jsx
│           ├── LinksDropdownItem.jsx
│           ├── MenuMenu.jsx       # internal nav dropdown (GET /menu.json)
│           ├── MenuDropdown.jsx
│           ├── MenuDropdownItem.jsx
│           ├── controllers/       # incl. LinksMenuController.jsx, MenuMenuController.jsx
│           └── helpers/           # incl. LinksMenuHelper.jsx, LinksDropdownHelper.jsx,
│                                  #       MenuMenuHelper.jsx, MenuDropdownHelper.jsx
├── spec/
├── vite.config.js
└── eslint.config.mjs
```

## Component conventions

Non-trivial components follow a three-file structure:

- `<Name>.jsx` — the component itself: state, effects, and delegation to Helper/Controller.
- `helpers/<Name>Helper.jsx` — pure rendering helpers; no data fetching or side effects.
- `controllers/<Name>Controller.jsx` — data management: API calls, event handlers, derived state. No JSX.

Components live in either `components/pages/` (full page views registered as routes) or `components/elements/` (reusable UI widgets). Apply the split when a component has data fetching or non-trivial rendering. Trivial components (`CollapsibleSection`, `Layout`, `StatItem`, `JobStatItem`) do not need splitting.

`Jobs` / `pages/helpers/JobsHelper` / `pages/controllers/JobsController` is the canonical example.

## Routing

`main.jsx` uses `HashRouter`:

| Path | Component | Description |
|------|-----------|-------------|
| `/` | `Layout` | Root outlet — always rendered. |
| `/jobs` | `Jobs` | All jobs across every status. |
| `/jobs/:status` | `Jobs` | Jobs filtered to one status. |
| `/job/:id` | `Job` | Full detail for a single job. |
| `/memory/status` | `MemoryStatus` | Memory usage and status |
| `/emissions` | `Emissions` | Live emission feed (counts strip + status filter). |
| `/extractions` | `Extractions` | Per-crawl chain: resource → parser → items → emits sent → emit status. |

Extension routes from mounted bundles are appended **after** the stock routes,
nested inside the `Layout` `<Outlet>` and wrapped in `ExtensionErrorBoundary`, so
a throwing extension page shows an inline alert rather than blanking the navbar or
stock pages. Each extension route is reached at `#<path>` (e.g. `#/ext/reports`)
like any stock route. When no extension is mounted — `GET /extensions/frontend.json`
returns `{ bundles: [] }` — the rendered router tree is byte-for-byte identical to
the stock-only tree.

## Component hierarchy

```
Layout
├── MenuMenu       (internal nav dropdown — data-driven from GET /menu.json)
├── LinksMenu      (external links dropdown — GET /links.json)
├── StatsHeader    (auto-refresh every 5 s)
│   └── StatsDisplay
│       ├── StatItem         (workers: idle, busy)
│       ├── JobStatItem[]    (jobs: enqueued, processing, failed, finished, dead)
│       └── StatItem[]       (emissions: extracted → /extractions; emitted/failed/dead → /emissions)
├── EngineControls (auto-refresh every 2 s)
└── <Outlet>
    ├── Jobs             (route: /jobs or /jobs/:status)
    ├── Job              (route: /job/:id)
    │   ├── CollapsibleSection  (Arguments)
    │   ├── ReadyCountdown      (failed only)
    │   └── CollapsibleSection  (Last Error — failed/dead only)
    ├── MemoryStatus     (route: /memory/status)
    ├── Emissions        (route: /emissions — last_id cursor poll, ~1 s)
    └── Extractions      (route: /extractions — joins /extractions.json + /emissions.json, ~5 s)
```

`Layout` renders two independent header dropdowns: `LinksMenu` (external links,
`GET /links.json`) and `MenuMenu` (internal navigation, `GET /menu.json`). The
internal menu — Logs, Memory, and any operator-configured entries — is now
data-driven from `GET /menu.json` (backed by `config/menu.yml`) rather than
hard-coded as `StatItem` cards in `StatsDisplay`. The Logs and Memory routes are
unchanged and still reachable. `MenuDropdownItem` renders each entry by shape:
an internal `route` (`/…`) becomes a `react-router-dom` `<Link>` that navigates
in-app and closes the dropdown; an external `route` (`https?://…`) becomes an
`<a target="_blank" rel="noreferrer">`, like `LinksDropdownItem`. When
`GET /menu.json` returns no entries, `MenuMenu` renders nothing.

The entry list is fully resolved server-side (merge with defaults,
`defaults: false`, per-entry `hidden`, repositioning, and de-duplication); the
frontend renders `entries` verbatim and in order, applying no cap, sort, or
de-dup. The `MenuDropdown` panel scrolls via the `menu-dropdown-panel` class
(`max-height` + `overflow-y: auto`) so a long operator menu does not overflow the
viewport; `LinksDropdown` is unchanged.

## Extensions

The SPA can load extra pages contributed by externally built bundles that Navi
serves from a mounted folder. At boot, `main.jsx` awaits `loadExtensions()`
before the single `createRoot(...).render(...)`:

1. Fetch `GET /extensions/frontend.json` (with a ~2 s `AbortController` timeout).
   Any network error, non-2xx, bad JSON, or timeout → warn and treat as
   `{ bundles: [] }`. The endpoint never 404s.
2. For each descriptor in `bundles` (order is significant — lexicographic by
   filename), if `css` is set append a deduped `<link rel="stylesheet">`, then
   `import(/* @vite-ignore */ src)` the bundle `.js` served from
   `GET /extensions/frontend/*path`.
3. The bundle's `default` export must be an array of `{ path, text, component }`
   where `path` is a non-empty, whitespace-free, `/`-prefixed string, `text` is a
   non-empty string, and `component` is a function. Invalid bundles or
   descriptors are skipped with a `console.warn`; the rest still load
   (skip-and-warn, never throw).
4. Surviving descriptors become nested `<Route>`s (see Routing) and their
   `{ route: path, text }` are appended to the `MenuMenu` entries after the
   `/menu.json` `entries`, deduped by route, minus any route listed in the
   `/menu.json` `hidden` array. A failure in either source leaves the other's
   entries intact. `loadExtensions()` memoises its work so `main.jsx` and
   `MenuMenuController` share one fetch/import pass.

Extension bundles are built separately and must reuse the host's React instance.
`vite.config.js` emits a fixed, unhashed `assets/react-vendor.js` chunk
(`manualChunks` + `chunkFileNames`) containing `react`, `react-dom`,
`react-dom/client`, and `react-router-dom`, and `index.html` carries an
`importmap` pointing those four bare specifiers at that file so a bundle's
runtime `import 'react'` resolves to the same module instance.

See [`docs/agents/web-server.md`](web-server.md) for the `/extensions/frontend*`
routes and the `/menu.json` `hidden` array.

## Job status → colour mapping

| Status | Bootstrap variant |
|--------|------------------|
| `enqueued` | `secondary` |
| `processing` | `primary` |
| `failed` | `danger` |
| `finished` | `success` |
| `dead` | `dark` |

## Build and integration

1. Run `yarn build` inside the frontend container.
2. Vite compiles to `frontend/dist/`, which is copied to `source/static/`.
3. The Express web server serves the built files from `source/static/`.

`source/static/` is not committed. The frontend is built by CI at release time. During local development, set `FRONTEND_DEV_MODE=true` so the dev proxy forwards asset requests to the Vite dev server (port 8080) instead.

## Available commands

```bash
yarn build      # Production build → dist/
yarn server     # Dev server with HMR on :8080
yarn test       # Jasmine tests with c8 coverage
yarn spec       # Jasmine tests without coverage
yarn lint       # ESLint check
yarn lint_fix   # ESLint auto-fix
yarn report     # jscpd copy-paste detection
```

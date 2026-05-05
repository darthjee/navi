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

```
frontend/
├── src/
│   ├── main.jsx                  # React entrypoint; router setup
│   ├── clients/                  # API client modules (pure fetch)
│   │   ├── StatsClient.js        # GET /stats.json
│   │   ├── JobsClient.js         # GET /jobs/:status.json
│   │   ├── JobClient.js          # GET /job/:id.json
│   │   └── EngineClient.js       # GET /engine/status + PATCH /engine/*
│   ├── constants/
│   │   └── jobStatus.js          # Status → Bootstrap color variant mapping
│   └── components/
│       ├── pages/                # Full page/route-level components
│       │   ├── Layout.jsx
│       │   ├── Jobs.jsx
│       │   ├── Job.jsx
│       │   ├── LogsPage.jsx
│       │   ├── controllers/      # Data/logic controller classes
│       │   └── helpers/          # HTML rendering helpers
│       └── elements/             # Reusable UI widgets
│           ├── BaseUrlsMenu.jsx
│           ├── EngineControls.jsx
│           ├── StatsHeader.jsx
│           ├── JobDetails.jsx
│           ├── ReadyCountdown.jsx
│           ├── Logs.jsx
│           ├── controllers/
│           └── helpers/
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

## Component hierarchy

```
Layout
├── StatsHeader    (auto-refresh every 5 s)
│   ├── StatItem         (workers: idle, busy)
│   └── JobStatItem[]    (jobs: enqueued, processing, failed, finished, dead)
├── EngineControls (auto-refresh every 2 s)
└── <Outlet>
    ├── Jobs             (route: /jobs or /jobs/:status)
    └── Job              (route: /job/:id)
        ├── CollapsibleSection  (Arguments)
        ├── ReadyCountdown      (failed only)
        └── CollapsibleSection  (Last Error — failed/dead only)
```

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

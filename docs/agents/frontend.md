# Frontend

The frontend is a React SPA that provides a real-time monitoring dashboard for Navi's job queues and worker pool. It is built with Vite and served by the main application's web server from `source/static/`.

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
│   │   ├── JobsClient.js         # GET /jobs/:status.json (all or single status)
│   │   └── JobClient.js          # GET /job/:id.json
│   │   └── EngineClient.js       # GET /engine/status + PATCH /engine/{pause,stop,continue,start,restart}
│   ├── constants/
│   │   └── jobStatus.js          # Status → Bootstrap color variant mapping
│   └── components/
│       ├── Layout.jsx            # Root layout: header + StatsHeader + EngineControls + Outlet
│       ├── StatsHeader.jsx       # Live stats bar (auto-refreshes every 5 s)
│       ├── EngineControls.jsx    # Engine lifecycle control buttons (auto-refreshes every 2 s)
│       ├── StatItem.jsx          # Generic stat card (label + value, optional link)
│       ├── JobStatItem.jsx       # Stat card that links to /jobs/:status
│       ├── Jobs.jsx              # Job list page
│       ├── Job.jsx               # Job detail page
│       └── ReadyCountdown.jsx    # Live countdown to retry eligibility
├── spec/                         # Jasmine tests
│   └── support/
│       ├── loader.js             # Custom loader for JSX/ESM
│       └── dom.js                # jsdom setup
├── vite.config.js
└── eslint.config.mjs
```

## Routing

`main.jsx` uses `HashRouter` (hash-based URLs require no server-side configuration):

| Path | Component | Description |
|------|-----------|-------------|
| `/` | `Layout` | Root outlet — always rendered. |
| `/jobs` | `Jobs` | All jobs across every status. |
| `/jobs/:status` | `Jobs` | Jobs filtered to one status. |
| `/job/:id` | `Job` | Full detail for a single job. |

## API clients

All clients use native `fetch()` with no third-party HTTP library.

### `StatsClient`

```
GET /stats.json
→ { workers: { idle, busy }, jobs: { enqueued, processing, failed, finished, dead } }
```

Normalises missing fields to `0`.

### `JobsClient`

```
GET /jobs/:status.json  (for a single status)
```

`fetchJobs()` fires all five status requests in parallel and flattens the results.  
`fetchJobsByStatus(status)` fires a single request.

### `JobClient`

```
GET /job/:id.json
→ job object, or null on 404, throws on other errors
```

## Component hierarchy

```
Layout
├── StatsHeader    (auto-refresh every 5 s)
│   ├── StatItem         (workers: idle, busy)
│   └── JobStatItem[]    (jobs: enqueued, processing, failed, finished, dead)
├── EngineControls (auto-refresh every 2 s)
└── <Outlet>
    ├── Jobs             (route: /jobs  or  /jobs/:status)
    └── Job              (route: /job/:id)
        ├── CollapsibleSection  (Arguments)
        ├── ReadyCountdown      (failed only)
        └── CollapsibleSection  (Last Error — failed/dead only, when error present)
```

### `Layout`

Root component. Renders the application header, `StatsHeader`, `EngineControls`, then delegates the main content to the React Router `Outlet`.

### `StatsHeader`

Fetches `/stats.json` every 5 seconds. Displays worker counts (idle / busy) and clickable job-count cards for each status. Cleans up the interval on unmount.

### `EngineControls`

Fetches `GET /engine/status` every 2 seconds (polling interval: `POLL_INTERVAL_MS = 2000`) to track the current engine state. Renders five buttons with conditional availability:

| Button | Enabled when |
|--------|-------------|
| Pause | `running` |
| Stop | `running` |
| Restart | `running` |
| Continue | `paused` |
| Start | `stopped` |
| *(all disabled)* | `pausing`, `stopping` |

During transitional states (`pausing`, `stopping`) a spinner is shown alongside the buttons. On button click, the corresponding `EngineClient` method is called and the status is immediately refreshed. The polling interval is cancelled on unmount to prevent memory leaks.

### `StatItem`

Generic card showing a label and a numeric value. Accepts an optional `to` prop to render as a navigable link.

### `JobStatItem`

Thin wrapper around `StatItem` that links to `/jobs/:status`.

### `Jobs`

List page. Reads the optional `:status` route parameter and fetches either all jobs or a status-filtered subset. Renders a loading spinner, an error alert, or a table with columns: ID (link), Status (badge), Attempts, and Class.

### `Job`

Detail page. Fetches a single job by `:id`. Renders status-aware fields:

| Field | Statuses |
|-------|----------|
| ID | all |
| Status (badge) | all |
| Attempts | all |
| Class | all |
| Arguments (collapsible, collapsed by default) | all |
| Remaining Attempts | `enqueued`, `processing`, `failed` |
| Ready In (`ReadyCountdown`) | `failed` |
| Last Error + backtrace (collapsible, collapsed by default) | `failed`, `dead` — only when a recorded error is present |

Shows "Job not found" on 404.

### `CollapsibleSection`

Thin wrapper around a native `<details>`/`<summary>` element. Used to wrap Arguments JSON and Last Error / backtrace content. Collapsed by default.

### `ReadyCountdown`

Receives `readyInMs`. Counts down locally every 1 second; shows "Ready" when the value reaches zero and clears its interval.

## Job status → colour mapping

Defined in `constants/jobStatus.js` as Bootstrap variant names:

| Status | Bootstrap variant |
|--------|------------------|
| `enqueued` | `secondary` |
| `processing` | `primary` |
| `failed` | `danger` |
| `finished` | `success` |
| `dead` | `dark` |

## Build and integration with the backend

1. Run `yarn build` inside the frontend container (or the `navi_frontend` Docker Compose service).
2. Vite compiles the source to `frontend/dist/`.
3. The output is copied to `source/static/`, from where the Express web server serves it.

The frontend uses **relative URLs** for all API calls, so no base-URL configuration is required.

> **Note:** `source/static/` is not committed to the repository. The frontend is built automatically by the CI/CD pipeline (`npm-publish` job in CircleCI) at release time. During local development, set `FRONTEND_DEV_MODE=true` so the dev proxy forwards asset requests to the Vite dev server instead of relying on built files in `source/static/`.

## Development server

The Vite dev server runs on port **8080** with HMR and CORS enabled:

```bash
yarn server   # inside the frontend container
```

During development, API calls go to the backend running on a different port; CORS is allowed for this reason.

## Available commands

Run these inside the frontend container:

```bash
yarn build      # Production build → dist/
yarn server     # Dev server with HMR on :8080
yarn test       # Jasmine tests with c8 coverage
yarn spec       # Jasmine tests without coverage
yarn lint       # ESLint check
yarn lint_fix   # ESLint auto-fix
yarn report     # jscpd copy-paste detection
```

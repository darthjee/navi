# Issue #372 — Add more information to jobs views

## Problem

The jobs index and show views (both frontend and backend API) display only minimal
information per job: `id`, `status`, and `attempts`. This is insufficient to diagnose
problems or understand what a job is doing at a glance.

Specifically:

- The **index view** (`GET /jobs/:status.json` + `Jobs` component) is missing the job class.
- The **show view** (`GET /job/:id.json` + `Job` component) is missing job class, arguments,
  remaining attempts, and whether the job is cooling down or ready to retry.
- The current `JobSerializer` uses a single representation for both views, and does not
  distinguish between job types.

## Expected Behaviour

### Index view

| Field      | Description                        |
|------------|------------------------------------|
| `id`       | Unique job identifier (existing)   |
| `status`   | Queue status (existing)            |
| `attempts` | Failed attempt count (existing)    |
| `jobClass` | The job class name (new)           |

### Show view

| Field               | Description                                                            |
|---------------------|------------------------------------------------------------------------|
| `id`                | Unique job identifier (existing)                                       |
| `status`            | Queue status (existing)                                                |
| `attempts`          | Failed attempt count (existing)                                        |
| `jobClass`          | The job class name (new)                                               |
| `arguments`         | Job-specific arguments (new, varies per job class)                     |
| `remainingAttempts` | How many retries are still allowed (new)                               |
| `readyInMs`         | Milliseconds until the job is eligible for retry; `0` when ready (new) |

#### `arguments` shape per job class

| Class                 | `arguments` shape                                   |
|-----------------------|-----------------------------------------------------|
| `ResourceRequestJob`  | `{ url: string, parameters: object }`               |
| `ActionProcessingJob` | `{ item: object }`                                  |
| `HtmlParseJob`        | `{ assetCount: number }`                            |
| `AssetDownloadJob`    | `{ url: string, clientName: string }`               |

#### `remainingAttempts`

- `ResourceRequestJob` and `AssetDownloadJob`: default max retries = 3
- `ActionProcessingJob` and `HtmlParseJob`: max retries = 1 (exhausted after first failure)

#### `readyInMs`

Computed as `Math.max(0, job.readyBy - Date.now())`. When `0` the frontend displays
"Ready"; otherwise it displays a countdown.

## Solution

### Backend (`source/`)

1. **Expose arguments via getters** — Add a public `arguments` getter to each `Job`
   subclass returning a plain object with the relevant fields.

2. **Split serializers**:
   - `JobIndexSerializer` — serializes `id`, `status`, `attempts`, `jobClass`.
   - `JobShowSerializer` — serializes all index fields plus `arguments`,
     `remainingAttempts`, and `readyInMs`.
   - Both live in `source/lib/serializers/`.

3. **Master serializer** — Rename the current `JobSerializer` to a dispatcher that
   accepts a `view` option (`'index'` | `'show'`) and delegates to the appropriate
   serializer.

4. **Update handlers**:
   - `JobsRequestHandler` — pass `view: 'index'` to the master serializer.
   - `JobRequestHandler` — pass `view: 'show'` to the master serializer.

### Frontend (`frontend/`)

1. **`Jobs` component** — Add a "Class" column to the table, bound to `job.jobClass`.

2. **`Job` component**:
   - Add rows for `jobClass`, `arguments` (rendered as formatted JSON), `remainingAttempts`.
   - Add a countdown row for `readyInMs`: show "Ready" when `0`, otherwise show a live
     countdown that updates every second.

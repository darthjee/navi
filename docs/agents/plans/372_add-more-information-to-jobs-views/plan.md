# Plan — Issue #372: Add more information to jobs views

## Overview

Enrich both the index and show representations of jobs in the Navi web interface.
Changes are needed in the backend serializer layer (`source/`) and the React frontend
(`frontend/`).

---

## Backend (`source/`)

### 1. Add `arguments` getters to Job subclasses

Add a public `arguments` getter to each concrete `Job` subclass so serializers can
read job-specific data without accessing private fields.

| Class                 | Getter returns                                         |
|-----------------------|--------------------------------------------------------|
| `ResourceRequestJob`  | `{ url: string, parameters: object }`                  |
| `ActionProcessingJob` | `{ item: object }`                                     |
| `HtmlParseJob`        | `{ assetCount: number }`                               |
| `AssetDownloadJob`    | `{ url: string, clientName: string }`                  |

Each getter reads from the existing private fields (no state change).

### 2. Create `JobIndexSerializer`

New file: `source/lib/serializers/JobIndexSerializer.js`

Extends `Serializer`. Serializes:
- `id`
- `status` (from options)
- `attempts`
- `jobClass` → `job.constructor.name`

### 3. Create `JobShowSerializer`

New file: `source/lib/serializers/JobShowSerializer.js`

Extends `Serializer`. Serializes all index fields plus:
- `arguments` → `job.arguments`
- `remainingAttempts` → computed from `_attempts` and the job's max retries
- `readyInMs` → `Math.max(0, job.readyBy - Date.now())`

`remainingAttempts` logic:
- `ResourceRequestJob` and `AssetDownloadJob`: `Math.max(0, 3 - job._attempts)`
- `ActionProcessingJob` and `HtmlParseJob`: `Math.max(0, 1 - job._attempts)`
- Default fallback: expose via `job.maxRetries` getter on `Job` base class (preferred)

Preferred approach: add a `maxRetries` getter to `Job` (default 3) and override it in
`ActionProcessingJob` and `HtmlParseJob` to return 1.

### 4. Refactor `JobSerializer` into a dispatcher

Rename current `JobSerializer._serializeObject` implementation into `JobIndexSerializer`.
Rewrite `JobSerializer` as a dispatcher:

```
JobSerializer.serialize(job, { status, view })
  view === 'show'  → JobShowSerializer.serialize(job, { status })
  view === 'index' → JobIndexSerializer.serialize(job, { status })
  default          → JobIndexSerializer.serialize(job, { status })
```

### 5. Update request handlers

- `JobsRequestHandler#handle` — add `view: 'index'` to the serializer call.
- `JobRequestHandler#handle` — add `view: 'show'` to the serializer call.

### 6. Update specs

- `JobSerializer_spec.js` — test dispatcher for both views.
- New `JobIndexSerializer_spec.js` — test index serialization.
- New `JobShowSerializer_spec.js` — test show serialization (including countdown, arguments).
- Update each Job subclass spec to cover the new `arguments` getter.
- Update `JobRequestHandler_spec.js` and `JobsRequestHandler_spec.js` to assert new fields.

---

## Frontend (`frontend/`)

### 7. Update `Jobs` component

File: `frontend/src/components/Jobs.jsx`

- Add `<th>Class</th>` header column.
- Add `<td>{job.jobClass}</td>` data cell per row.
- Update `Jobs_spec.js` to assert the new column.

### 8. Update `Job` component

File: `frontend/src/components/Job.jsx`

- Add `<dt>Class</dt><dd>{job.jobClass}</dd>` row.
- Add `<dt>Arguments</dt><dd><pre>{JSON.stringify(job.arguments, null, 2)}</pre></dd>` row.
- Add `<dt>Remaining attempts</dt><dd>{job.remainingAttempts}</dd>` row.
- Add a countdown row for retry readiness:
  - When `job.readyInMs === 0` → display "Ready".
  - Otherwise → display a live countdown (using `useEffect` + `setInterval`, decremented
    every second until it reaches 0).
- Update `Job_spec.js` to assert all new fields and the "Ready" / countdown states.

### 9. Rebuild frontend assets

Run `yarn build` inside the frontend container to update `source/static/` with the new
bundle before submitting the PR.

---

## Checklist

- [ ] Add `arguments` getter to `ResourceRequestJob`
- [ ] Add `arguments` getter to `ActionProcessingJob`
- [ ] Add `arguments` getter to `HtmlParseJob`
- [ ] Add `arguments` getter to `AssetDownloadJob`
- [ ] Add `maxRetries` getter to `Job` base class (default 3)
- [ ] Override `maxRetries` in `ActionProcessingJob` (returns 1)
- [ ] Override `maxRetries` in `HtmlParseJob` (returns 1)
- [ ] Create `JobIndexSerializer`
- [ ] Create `JobShowSerializer`
- [ ] Refactor `JobSerializer` into dispatcher
- [ ] Update `JobsRequestHandler` to pass `view: 'index'`
- [ ] Update `JobRequestHandler` to pass `view: 'show'`
- [ ] Write / update all backend specs
- [ ] Update `Jobs.jsx` to show job class column
- [ ] Update `Job.jsx` to show job class, arguments, remaining attempts, countdown
- [ ] Write / update all frontend specs
- [ ] Run `yarn build` in frontend container to rebuild assets
- [ ] Run `yarn coverage && yarn lint && yarn report` in `source/`
- [ ] Run `yarn coverage && yarn lint && yarn report` in `frontend/`

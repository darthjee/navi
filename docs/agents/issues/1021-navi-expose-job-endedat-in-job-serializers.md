# Issue: Navi: expose Job#endedAt in job serializers

## Description

Follow-up of #1015, which explicitly scopes `endedAt` exposure out. Depends on the deku-swarm contract from #1006.

Surface deku-swarm's `Job#endedAt` in navi's job JSON payloads and in the monitoring dashboard, so operators can see when each resident finished/dead job ended.

## Problem

Deku-swarm #1006 added `Job#endedAt` (set via `markEnded()` when a job reaches a terminal state, cleared by `clearEnded()`), but navi does not surface it. `JobIndexSerializer` returns `{ id, status, attempts, jobClass[, url] }` and `JobShowSerializer` has no end timestamp either, so neither `GET /jobs/:status.json` nor `GET /job/:id.json` tells an operator when a finished or dead job ended.

With `workers.retention_finished` / `workers.retention_dead` (#1015) evicting the oldest terminal jobs, knowing when each resident job ended helps explain what the dashboard is still showing and what is about to be pruned.

## Expected Behavior

### Wire format

`endedAt` is serialized as an ISO 8601 string (e.g. `"2026-11-17T12:34:56.789Z"`), converting deku-swarm's epoch-ms `Job#endedAt` via `new Date(job.endedAt).toISOString()`. This matches every other navi serializer that emits timestamps (`LogSerializer`, `ExtractionSerializer`, `EmissionSerializer`, `MemoryDataSerializer`) and is what the frontend's `formatTimestamp` expects (it already renders a missing value as `—`). Raw epoch ms was rejected because it would be the only numeric timestamp in the API.

### Presence rule

Both `JobIndexSerializer` and `JobShowSerializer` **always** include the `endedAt` key. Its value is driven by `job.endedAt` itself, not by the status label:

- `job.endedAt` set → its ISO string;
- `job.endedAt` `null`/`undefined` (enqueued, processing, failed, or a dead job that was retried and had `clearEnded()` applied) → `null`.

This gives consumers a stable row shape (the jobs table renders `null` as `—` via `formatTimestamp`) and avoids keeping a navi-side status set in sync with deku-swarm's notion of terminal states. Unlike `remainingAttempts`/`readyInMs`/`lastError`, `endedAt` is deliberately **not** gated by a status set.

### Edge cases

- **Retried dead job:** `retryJob` calls `clearEnded()`, so `endedAt` serializes as `null` while the job is back in retry/processing. If it ends again, `markEnded()` overwrites the value — only the **latest** end time is exposed; no history is kept.
- **Failed but not exhausted:** `markEnded()` is not called, `endedAt` stays `null` — correct, the job is not terminal.
- **Pruned by retention (#1015):** the job is no longer in the registry, so `GET /job/:id.json` keeps returning 404 — no new behaviour needed.
- **`endedAt` `undefined`** (e.g. a job object/spec double without the #1006 field): treated like `null` → serialized as `null`; the serializer must never emit `"Invalid Date"` or throw.
- **Time zones:** the API emits UTC (`...Z`); the frontend renders it via `formatTimestamp` in the browser's local time, consistent with the logs/extractions pages. No explicit UTC label is added.

## Solution

### Scope

#### In scope

- **Backend:** add `endedAt` to both `JobIndexSerializer` (jobs list, `GET /jobs/:status.json`) and `JobShowSerializer` (job detail, `GET /job/:id.json`).
- **Frontend job detail page** (`JobDetailsHelper.jsx`): show an "Ended at" entry for terminal (finished/dead) jobs, formatted with the existing `frontend/src/utils/formatTimestamp.js`.
- **Frontend jobs table** (`JobRow.jsx` / `JobsTableHelper.jsx`): add an "Ended at" column, rendering `—` when the job has no end timestamp.

#### Out of scope

- `clients/node` (navi-client): it exposes no job endpoints, so nothing changes there.
- deku-swarm: the `Job#endedAt` / `markEnded()` / `clearEnded()` contract from #1006 is consumed as is.
- Sorting or filtering jobs by `endedAt`, or any "about to be pruned" indicator (possible follow-up).
- Any change to the retention configuration or behaviour (#1015).

### Alternatives considered

- **Raw `endedAt` timestamp (chosen):** simple and truthful; anything else (age, ordering) can be derived client-side.
- **Server-computed age (`endedAgoMs`, à la `readyInMs`):** rejected — stale as soon as it is rendered, and trivially derivable from `endedAt`.
- **"Will be pruned" flag / prune ETA:** rejected for now — automatic retention (#1015) is count-based (`keep`), so eviction depends on future job completions and no meaningful ETA exists; at best a queue position. Possible follow-up.
- **Full lifecycle timestamps (`createdAt`, `startedAt`, `endedAt`):** would enable queue-wait / run-duration insight, but requires new deku-swarm fields. Out of scope; possible follow-up.

### Backward compatibility

Purely additive — no breaking change:

- **API:** a new `endedAt` key is added to both job payloads; nothing is renamed or removed, URLs are unchanged.
- **navi-client:** exposes no job methods — unaffected.
- **Frontend:** updated in this same issue, shipped in the same image — no version skew.
- **Data:** none persisted; jobs are in-memory and `Job#endedAt` already exists since #1006.
- **Expected ripple:** spec files in `source/spec` and `frontend/spec` that assert exact job payloads need `endedAt` added.
- **Docs:** `docs/agents/web-server.md` (job JSON shapes) must document `endedAt`. No user-facing guide in `docs/guides` documents the job payload, so none changes.

### Testing strategy

**Backend — serializer unit specs** (`source/spec/lib/serializers/`):

- `JobIndexSerializer_spec.js`, `JobShowSerializer_spec.js`, `JobShowSerializer_dead_spec.js`:
  - job after `markEnded(<fixed ms>)` → `endedAt` equals the exact expected ISO string (fixed timestamp, no clock mocking);
  - job never ended → `endedAt: null`;
  - job ended then `clearEnded()` (retry path) → `endedAt: null`;
  - job double with `endedAt` `undefined` → `endedAt: null`, no throw, no `"Invalid Date"`.
- `JobSerializer_spec.js`: the dispatcher carries `endedAt` through both `index` and `show` views.

**Backend — handler specs** (`source/spec/lib/server/handlers/jobs/`):

- `JobsHandler_spec.js`, `JobHandler_spec.js`: update expected payloads; add a case where a job is finished through the real registry `finish()` path and assert `endedAt` is a non-null ISO string (proves the deku-swarm contract end to end).

**Frontend** (`frontend/spec/components/`):

- `JobRow_spec.js` / `JobsTable_spec.js`: "Ended at" header present; cell renders the formatted timestamp when set and `—` when `null`.
- `Job_spec.js` / `Job_status_spec.js`: detail page shows "Ended at" for a finished/dead job and handles `null` for other statuses.
- Update existing job fixtures (e.g. `Jobs_spec.js`) to include `endedAt`.

**Gates:** `source` and `frontend` spec suites and lint pass; coverage thresholds hold.

### Performance & security

- **Performance:** one `new Date(ms).toISOString()` per serialized job — negligible next to existing serialization; job lists are already bounded by pagination and retention (#1015). No new registry lookups or sorts; the frontend adds one table cell per row and no extra requests.
- **Security:** no new endpoint, auth path, or input — read-only output. `endedAt` is a server-generated timestamp with no user-controlled content (and React escapes rendered text). It is exposed to the same audience that already sees the full job payload (arguments, errors, backtraces), so there is no new disclosure concern.

## Benefits

- Operators can tell when each finished/dead job ended, from both the API and the dashboard.
- Makes retention (#1015) behaviour explainable: the oldest-ended jobs are the next to be evicted.
- Purely additive, consistent with every other timestamp in navi's API.

# Plan: Add Retry Button on Job

## Overview

Add a `PATCH /jobs/:id/retry` backend endpoint and a "Retry" button to the Job detail page. The button appears only for `failed` and `dead` jobs. Clicking it removes the job from its current queue and pushes it directly to the retry queue, bypassing the automatic cooldown.

## Context

- `failed` jobs live in a `SortedCollection` sorted by `readyBy`; removing one requires filtering the list and rebuilding the collection (same pattern used in `promoteReadyJobs()`).
- `dead` jobs live in an `IdentifyableCollection` which has `get(id)` and `remove(id)`.
- The frontend `Job.jsx` currently has no mechanism to trigger a refresh after an action; a `refreshKey` state will be added for this purpose.
- `JobClient.js` currently exports a single default function; a named `retryJob` export will be added alongside it.

## Implementation Steps

### Step 1 — Add `retryJob(id)` to `JobRegistryInstance`

Remove the job from its current queue and push it to `#retryQueue`. Return the job if found, `null` otherwise.

For `failed` (SortedCollection — no `remove` method): filter via `list()` and rebuild, following the same pattern as `promoteReadyJobs()`.
For `dead` (IdentifyableCollection): use `get(id)` + `remove(id)`.

```js
retryJob(id) {
  const allFailed = this.#failed.list();
  const failedJob = allFailed.find(j => j.id === id);
  if (failedJob) {
    this.#failed = new SortedCollection(
      allFailed.filter(j => j.id !== id),
      { sortBy: FAILED_SORT_BY }
    );
    this.#retryQueue.push(failedJob);
    return failedJob;
  }

  const deadJob = this.#dead.get(id);
  if (deadJob) {
    this.#dead.remove(id);
    this.#retryQueue.push(deadJob);
    return deadJob;
  }

  return null;
}
```

### Step 2 — Delegate via `JobRegistry`

Add the static delegate method to `JobRegistry`:

```js
static retryJob(id) {
  return JobRegistry.#getInstance().retryJob(id);
}
```

### Step 3 — Create `JobRetryRequestHandler`

New file `source/lib/server/JobRetryRequestHandler.js`:

```js
handle(req, res) {
  const { id } = req.params;
  const result = JobRegistry.jobById(id);

  if (!result) throw new NotFoundError('Job not found');
  if (!['failed', 'dead'].includes(result.status)) throw new ConflictError();

  JobRegistry.retryJob(id);
  res.json({ status: 'enqueued' });
}
```

### Step 4 — Register the route in `Router`

Add to `PATCH_ROUTES`:

```js
'/jobs/:id/retry': new JobRetryRequestHandler(),
```

Import `JobRetryRequestHandler` alongside the other handler imports.

### Step 5 — Add `retryJob` to `JobClient.js`

Add a named export alongside the existing default:

```js
export const retryJob = (id) => {
  return fetch(`/jobs/${id}/retry`, { method: 'PATCH' })
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    });
};
```

### Step 6 — Add `handleRetry` to `JobController`

```js
static handleRetry(id, refresh) {
  retryJob(id).then(refresh).catch(noop);
}
```

### Step 7 — Update `Job.jsx` to support refresh after retry

Add a `refreshKey` state incremented after a successful retry, and wire up `onRetry`:

```jsx
const [refreshKey, setRefreshKey] = useState(0);
const refresh = useCallback(() => {
  setRefreshKey(k => k + 1);
  setLoading(true);
}, []);

// eslint-disable-next-line react-hooks/exhaustive-deps
useEffect(JobController.buildEffect(id, setJob, setError, setLoading), [id, refreshKey]);

return <JobDetails job={job} onRetry={() => JobController.handleRetry(id, refresh)} />;
```

### Step 8 — Update `JobDetails` and `JobDetailsHelper`

`JobDetails.jsx` — accept and forward the `onRetry` prop:

```jsx
function JobDetails({ job, onRetry }) {
  return JobDetailsHelper.render(job, onRetry);
}
```

`JobDetailsHelper` — add a private `#renderRetryButton` and call it from `render`:

```js
static #RETRYABLE_STATUSES = new Set(['failed', 'dead']);

static render(job, onRetry) {
  // ... existing render ...
  // add below the "Back to Jobs" link:
  {JobDetailsHelper.#renderRetryButton(job, onRetry)}
}

static #renderRetryButton(job, onRetry) {
  if (!JobDetailsHelper.#RETRYABLE_STATUSES.has(job.status)) return null;
  return (
    <div className="mt-3">
      <button className="btn btn-warning" onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}
```

### Step 9 — Add specs

- `source/spec/lib/background/JobRegistryInstance_spec.js` — add `#retryJob` tests covering failed, dead, and not-found cases
- `source/spec/lib/background/JobRegistry_spec.js` — add delegate test for `retryJob`
- `source/spec/lib/server/JobRetryRequestHandler_spec.js` — new file, test 200/404/409
- `source/spec/lib/server/Router_spec.js` — verify the new PATCH route is registered
- `frontend/spec/clients/JobClient_spec.js` — test `retryJob` fetch call
- `frontend/spec/components/Job_spec.js` — test retry triggers refresh
- `frontend/spec/components/JobDetails_spec.js` — test Retry button visibility per status

## Files to Change

**Backend (`source/`)**
- `source/lib/background/JobRegistryInstance.js` — add `retryJob(id)`
- `source/lib/background/JobRegistry.js` — add static `retryJob(id)` delegate
- `source/lib/server/JobRetryRequestHandler.js` — new file
- `source/lib/server/Router.js` — import handler, add PATCH route
- `source/spec/lib/background/JobRegistryInstance_spec.js` — add `retryJob` tests
- `source/spec/lib/background/JobRegistry_spec.js` — add delegate test
- `source/spec/lib/server/JobRetryRequestHandler_spec.js` — new spec file
- `source/spec/lib/server/Router_spec.js` — add route registration test

**Frontend (`frontend/`)**
- `frontend/src/clients/JobClient.js` — add named `retryJob` export
- `frontend/src/components/controllers/JobController.jsx` — add `handleRetry`
- `frontend/src/components/Job.jsx` — add `refreshKey`, wire `onRetry`
- `frontend/src/components/JobDetails.jsx` — accept and forward `onRetry` prop
- `frontend/src/components/helpers/JobDetailsHelper.jsx` — add Retry button
- `frontend/spec/clients/JobClient_spec.js` — add `retryJob` test
- `frontend/spec/components/Job_spec.js` — test refresh after retry
- `frontend/spec/components/JobDetails_spec.js` — test Retry button visibility

## CI Checks

Before opening a PR, run the following checks for the folders being modified:

- `source/`: `docker-compose run --rm navi_tests bash -c "yarn spec"` (CircleCI job: `backend-tests`)
- `frontend/`: `docker-compose run --rm navi_frontend bash -c "yarn spec && yarn lint"` (CircleCI job: `frontend-tests`)

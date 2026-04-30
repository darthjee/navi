# Plan: Refactor `Job` Component

## Current State

- `Job.jsx` — component; uses `JobHelper.buildEffect` (data) and `JobHelper.render*` (HTML)
- `JobHelper.jsx` — mixes data loading logic and HTML rendering

## Target State

- `Job.jsx` — unchanged (already thin)
- `JobHelper.jsx` — HTML rendering only (`renderLoading`, `renderError`, `renderNotFound`)
- `JobView.jsx` — data loading logic (`buildEffect`)

## Implementation Steps

### Step 1 — Create `JobView.jsx`

Extract `buildEffect` (and its dependency on `fetchJob`) from `JobHelper` into a new `JobView` class.

```js
import fetchJob from '../clients/JobClient.js';

class JobView {
  static buildEffect(id, setJob, setError, setLoading) { ... }
}

export default JobView;
```

### Step 2 — Update `JobHelper.jsx`

Remove `buildEffect` and the `fetchJob` import. Keep only the three `render*` static methods.

### Step 3 — Update `Job.jsx`

Replace `JobHelper.buildEffect(...)` with `JobView.buildEffect(...)` and add the import.

## Files to Change

- `frontend/src/components/JobHelper.jsx` — remove `buildEffect` and `fetchJob` import
- `frontend/src/components/Job.jsx` — import `JobView`, use `JobView.buildEffect`
- `frontend/src/components/JobView.jsx` — **new file** with `buildEffect`

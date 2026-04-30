# Plan: Refactor `StatsHeader` Component

## Current State

- `StatsHeader.jsx` — mixes everything: state, `useEffect` with data fetching, polling, and full HTML rendering inline. No Helper or View file exists.

## Target State

- `StatsHeader.jsx` — thin component: state, effects, delegates rendering to Helper
- `StatsHeaderHelper.jsx` — **new file**: HTML rendering (`renderLoading`, `renderError`, `render`)
- `StatsHeaderView.jsx` — **new file**: data fetching and polling (`buildEffect`)

## Implementation Steps

### Step 1 — Create `StatsHeaderView.jsx`

Extract the `useEffect` logic into a `buildEffect(setStats, setError, setLoading)` static method:
- Calls `fetchStats()`
- Handles `.then`, `.catch`, `.finally`
- Sets up the `setInterval` polling (every 5000 ms)
- Returns the cleanup function

### Step 2 — Create `StatsHeaderHelper.jsx`

Extract the three render paths from `StatsHeader.jsx` into static methods:
- `renderLoading()` — spinner + "Loading stats…" paragraph
- `renderError(error)` — alert danger div
- `render(stats)` — the full stats bar with workers and jobs

### Step 3 — Update `StatsHeader.jsx`

Replace inline JSX and fetch logic with delegation to `StatsHeaderHelper` and `StatsHeaderView`.

## Files to Change

- `frontend/src/components/StatsHeader.jsx` — reduce to state + effects + delegation
- `frontend/src/components/StatsHeaderHelper.jsx` — **new file**
- `frontend/src/components/StatsHeaderView.jsx` — **new file**

# Plan: Reorganize Frontend Components

## Overview

Restructure `frontend/src/components/` by introducing two sub-folders — `pages/` for full page/view-level components and `elements/` for reusable UI widgets — and update all imports and documentation accordingly.

## Context

The current `frontend/src/components/` folder mixes full-page views with small reusable UI elements in a flat layout. For example, `LogsPage.jsx` (a route-level view) sits alongside `Logs.jsx` (a display widget used inside the page). Introducing a `pages/` vs `elements/` split creates a clear, scalable separation of concerns.

Route registration in `frontend/src/main.jsx` was used as the authoritative source to determine which components are pages.

## Component Classification

### `pages/` — top-level route components (registered in `main.jsx`)

| File | Route |
|------|-------|
| `Layout.jsx` | `/` (root layout) |
| `LogsPage.jsx` | `/logs` |
| `LogsPage.css` | (stylesheet for LogsPage) |
| `Jobs.jsx` | `/jobs` and `/jobs/:status` |
| `Job.jsx` | `/job/:id` |

### `elements/` — reusable UI components (not registered as routes)

| File | Used by |
|------|---------|
| `BaseUrlsMenu.jsx` | Layout |
| `CollapsibleSection.jsx` | various |
| `EngineControls.jsx` | Layout |
| `JobDetails.jsx` | Job page |
| `JobStatItem.jsx` | StatsHeader |
| `Logs.jsx` | LogsPage |
| `ReadyCountdown.jsx` | various |
| `StatItem.jsx` | StatsHeader |
| `StatsHeader.jsx` | Layout |

### `controllers/` and `helpers/` — unchanged

These sub-folders already exist and are kept as-is. They are referenced by their sibling components via relative imports that will be updated when the parent components move.

## Implementation Steps

### Step 1 — Create sub-folders

Create the two new directories:
- `frontend/src/components/pages/`
- `frontend/src/components/elements/`

### Step 2 — Move page components

Move to `frontend/src/components/pages/`:
- `Layout.jsx`
- `LogsPage.jsx`
- `LogsPage.css`
- `Jobs.jsx`
- `Job.jsx`

### Step 3 — Move element components

Move to `frontend/src/components/elements/`:
- `BaseUrlsMenu.jsx`
- `CollapsibleSection.jsx`
- `EngineControls.jsx`
- `JobDetails.jsx`
- `JobStatItem.jsx`
- `Logs.jsx`
- `ReadyCountdown.jsx`
- `StatItem.jsx`
- `StatsHeader.jsx`

### Step 4 — Update imports

Update import paths in:
- `frontend/src/main.jsx` — imports `Layout`, `LogsPage`, `Jobs`, `Job`
- Every moved component that imports another moved component or a `controllers/`/`helpers/` file — relative paths must be adjusted (e.g., `./helpers/` → `../helpers/`)

### Step 5 — Update documentation

Update `docs/agents/frontend.md` to describe the new `components/pages/` and `components/elements/` structure.

## Files to Change

- `frontend/src/components/pages/` — new folder; receives `Layout`, `LogsPage`, `LogsPage.css`, `Jobs`, `Job`
- `frontend/src/components/elements/` — new folder; receives all other flat components
- `frontend/src/main.jsx` — update import paths
- `frontend/src/components/**/*.jsx` — update relative imports broken by the move
- `docs/agents/frontend.md` — document new structure

## Notes

- `controllers/` and `helpers/` stay at `frontend/src/components/controllers/` and `frontend/src/components/helpers/`; only their callers' relative import paths change.
- No logic changes — this is a pure structural refactor.
- After moving files, run `yarn lint` inside the container to catch any missed import updates.

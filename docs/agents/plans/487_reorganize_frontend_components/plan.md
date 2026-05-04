# Plan: Reorganize Frontend Components

## Overview

Restructure `frontend/src/components/` by introducing two sub-folders — `pages/` for full page/view-level components and `elements/` for reusable UI widgets — and update all imports and documentation accordingly.

## Context

The current `frontend/src/components/` folder mixes full-page views with small reusable UI elements in a flat layout. For example, there is a page for logs alongside a component that merely displays log entries. This makes it harder to navigate the codebase and reason about the scope of each component. Introducing a `pages/` vs `elements/` split creates a clear, scalable separation of concerns.

## Implementation Steps

### Step 1 — Audit existing components

List every file in `frontend/src/components/` and classify each one as either a **page** (a top-level route view) or an **element** (a reusable UI widget used inside pages or other elements).

### Step 2 — Create sub-folders

Create the two new directories:
- `frontend/src/components/pages/`
- `frontend/src/components/elements/`

### Step 3 — Move files

Move each component file to its appropriate sub-folder based on the audit in Step 1.

### Step 4 — Update imports

Search the entire `frontend/` tree for any import statements that reference the moved files and update their paths to reflect the new locations.

### Step 5 — Update documentation

Update `docs/agents/frontend.md` to describe the new `components/pages/` and `components/elements/` structure, replacing any references to the old flat layout.

## Files to Change

- `frontend/src/components/**` — move files into `pages/` or `elements/` sub-folders
- `frontend/src/**` — update import paths that reference moved components
- `docs/agents/frontend.md` — document the new folder structure

## Notes

- The exact classification of each existing component (page vs element) must be confirmed during the audit step; some edge cases may require discussion.
- Router configuration (if any) may reference page components directly and will need updating.
- No new components are added as part of this issue — this is a pure structural refactor.

# Issue: Reorganize Frontend Components

## Description

The `frontend/src/components` folder currently mixes page-level components (full views) with reusable element-level components (buttons, panels, etc.) in a flat structure. This makes it harder to navigate and reason about the frontend architecture.

## Problem

- Components folder has no clear separation between pages and reusable UI elements.
- Example: there is a page for logs alongside a component to display logs, both at the same level.
- The flat structure makes it difficult to distinguish what is a full page view versus a shared widget.

## Expected Behavior

- `frontend/src/components` should contain two sub-folders:
  - `pages/` — full page/view-level components (e.g., the logs page).
  - `elements/` — reusable UI elements (e.g., log display panel, buttons).
- All existing components should be moved into the appropriate sub-folder.
- Documentation in `docs/agents/` should be updated to reflect the new structure.

## Solution

- Create `frontend/src/components/pages/` and `frontend/src/components/elements/`.
- Audit every file in `frontend/src/components/` and move it to `pages/` or `elements/` based on its role.
- Update all imports that reference moved files.
- Update `docs/agents/frontend.md` (and any other relevant docs) to describe the new folder structure.

## Benefits

- Clearer separation of concerns in the frontend codebase.
- Easier onboarding for new contributors.
- Consistent structure that scales as more components are added.

---
See issue for details: https://github.com/darthjee/navi/issues/487

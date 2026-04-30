# Issue: Refactor Components in Frontend

## Description

The components in `frontend/src/components/` currently mix three concerns in a single file: the component logic, data manipulation, and HTML rendering. This separation of concerns has already been solved for the `Job` component and needs to be applied to all other components.

## Problem

- Components in `frontend/src/components/` mix component logic, data manipulation, and HTML rendering in a single file.
- Only the `Job` component has been properly split into separate files so far.
- `JobsView.jsx` still needs to be renamed to `JobView.jsx` to follow the established convention.

## Expected Behavior

Each component should be split into three distinct files following the pattern established by `Job.jsx`:

- `<Name>.jsx` — the component itself
- `<Name>Helper.jsx` — HTML rendering helpers
- `<Name>View.jsx` — data manipulation logic

## Solution

- Rename `JobsView.jsx` to `JobView.jsx`.
- Identify all other components in `frontend/src/components/` that still mix concerns.
- Split each one into the three-file pattern: `<Name>.jsx`, `<Name>Helper.jsx`, and `<Name>View.jsx`.

## Benefits

- Improved separation of concerns across the frontend codebase.
- Consistent component structure that is easier to navigate and maintain.
- Aligns all components with the already-established pattern from the `Job` component refactor.

---
See issue for details: https://github.com/darthjee/navi/issues/461

# Issue: Review and reorganize folders in source/lib and source/specs due to project growth

## Description

The current folder structure under `source/lib` and `source/spec` has become insufficient as the
project has grown considerably. The modules and files need to be reviewed, reorganized, and
possibly split into a more scalable and maintainable structure.

## Problem

- The existing organization of `source/lib` and `source/spec` no longer scales well with the
  current size and complexity of the project.
- Finding and managing modules is becoming harder as the codebase grows.
- Spec files currently live directly under `source/spec/` (e.g. `source/spec/models/Job_spec.js`),
  at the same level as `source/spec/support/`. This causes confusion between spec files and
  support/helper files, since there is no clear visual or structural boundary between them.

## Expected Behavior

- Spec files mirror the `source/lib` folder structure under a `source/spec/lib/` subfolder.
  For example:
  - `source/lib/models/Job.js` → `source/spec/lib/models/Job_spec.js`
  - `source/lib/utils/Logger.js` → `source/spec/lib/utils/Logger_spec.js`
- Support files remain under `source/spec/support/`, clearly separated from spec files.
- A clear, well-scoped folder structure that reflects the project's current modules and concerns.
- All imports and references across the codebase updated to match the new organization.
- Documentation updated to reflect any structural changes.

## Solution

- Move all spec files from `source/spec/<category>/` to `source/spec/lib/<category>/`,
  preserving the existing subfolder structure (e.g. `models/`, `utils/`, `services/`, etc.).
- Update all import paths inside the moved spec files to account for the extra folder level.
- Update any test runner configuration (e.g. `jasmine.json` or `package.json` spec globs) to
  point to the new location.
- Evaluate whether `source/lib` itself also benefits from further reorganization as a follow-up.
- Update documentation to reflect the new structure.

## Benefits

- Eliminates confusion between spec files and support/helper files.
- Makes it immediately clear that `source/spec/lib/` mirrors `source/lib/` and
  `source/spec/support/` contains shared test utilities.
- Improves code maintainability.
- Makes it easier to find and manage modules as the project continues to grow.
- Prepares the codebase for new features and further scaling.

---
See issue for details: https://github.com/darthjee/navi/issues/194

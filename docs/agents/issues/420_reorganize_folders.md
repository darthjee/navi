# Issue: Reorganize Folders

## Description
The background job system has grown significantly and its related classes are spread across the codebase. To improve maintainability and enable future extraction into a standalone package, the background job classes need to be reorganized into a dedicated folder structure.

## Problem
- Background job-related classes are not grouped in a dedicated folder
- The codebase mixes classes that are tied to Navi's specific implementation with generic background worker classes that could be extracted into their own package
- The lack of clear separation makes it harder to reason about ownership and future modularization

## Expected Behavior
- All classes related to the background job infrastructure are moved into `source/lib/background/`
- Navi-specific `Job` subclasses are placed in `source/lib/jobs/`
- Navi-specific job classes and generic background worker classes do not mix in the same folder
- The folder structure makes it clear which classes are candidates for extraction into a standalone package
- All specs and documentation are updated to reflect the new folder structure

## Solution
- Identify all background job-related classes in the codebase (currently spread across `source/lib/models/`, `source/lib/factories/`, `source/lib/registry/`)
- All reorganization stays within `source/lib/` — no files move outside this boundary
- Create `source/lib/background/` for background worker infrastructure classes (those that could become a standalone package): `Job`, `Worker`, enqueuers, factories, registries
- Create `source/lib/jobs/` for Navi-specific `Job` subclasses: `ActionProcessingJob`, `AssetDownloadJob`, `HtmlParseJob`, `ResourceRequestJob`
- Move each class to its appropriate folder
- Update all import/require references throughout the codebase
- Update specs to reflect the new file locations
- Update relevant documentation (e.g., `docs/agents/`) to reflect the new folder structure
- Ensure tests pass after the reorganization

## Benefits
- Clearer separation of concerns between generic background infrastructure and Navi-specific logic
- Easier future extraction of the background worker system into its own package
- Improved navigability and maintainability of the codebase

---
See issue for details: https://github.com/darthjee/navi/issues/420

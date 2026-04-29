# Issue: Reorganize Folders

## Description
The background job system has grown significantly and its related classes are spread across the codebase. To improve maintainability and enable future extraction into a standalone package, the background job classes need to be reorganized into a dedicated folder structure.

## Problem
- Background job-related classes are not grouped in a dedicated folder
- The codebase mixes classes that are tied to Navi's specific implementation with generic background worker classes that could be extracted into their own package
- The lack of clear separation makes it harder to reason about ownership and future modularization

## Expected Behavior
- All classes related to the background job infrastructure are moved into a dedicated folder (e.g., `background/` or `jobs/`)
- Classes that inherit from `Job` (Navi-specific) are placed in a separate clustered subfolder
- Navi-specific job classes and generic background worker classes do not mix in the same folder
- The folder structure makes it clear which classes are candidates for extraction into a standalone package

## Solution
- Identify all background job-related classes in the codebase
- Create a dedicated folder for background worker infrastructure classes (those that could become a standalone package)
- Create a separate subfolder for Navi-specific `Job` subclasses
- Move each class to its appropriate folder
- Update all import/require references throughout the codebase
- Ensure tests pass after the reorganization

## Benefits
- Clearer separation of concerns between generic background infrastructure and Navi-specific logic
- Easier future extraction of the background worker system into its own package
- Improved navigability and maintainability of the codebase

---
See issue for details: https://github.com/darthjee/navi/issues/420

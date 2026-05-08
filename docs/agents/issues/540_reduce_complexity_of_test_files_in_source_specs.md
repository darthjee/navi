# Issue: Reduce Complexity of Test Files in source/specs

## Description

Some test files under `source/specs` have grown too complex and need to be simplified to improve maintainability, readability, and overall test quality.

## Problem

- Certain test files in `source/specs` have accumulated too much complexity over time.
- High complexity makes tests harder to read, maintain, and debug.
- It is not yet identified which files are the biggest contributors to this complexity.

## Expected Behavior

- Test files in `source/specs` should be concise, focused, and easy to understand.
- Each file should have a single clear responsibility.
- Shared logic should be extracted into reusable helpers or factories.

## Solution

- Identify the test files with the highest complexity (e.g., by lines of code, number of contexts, or cyclomatic complexity).
- Apply one or more of the following refactoring strategies:
  - **Split files**: Break large test files into smaller, more focused ones.
  - **Extract factories**: Move repeated object-creation logic into factory modules.
  - **Extract helpers**: Pull shared setup or assertion logic into helper modules.
  - Explore other refactoring opportunities as needed.

## Benefits

- Easier to read and maintain test suite.
- Faster onboarding for contributors unfamiliar with the codebase.
- Reduced risk of test regressions due to tangled test logic.

---
See issue for details: https://github.com/darthjee/navi/issues/540

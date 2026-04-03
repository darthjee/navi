# Issue: Fix Lint

## Description

Running `yarn lint` inside the Docker container reports multiple ESLint errors across the codebase. All lint errors must be resolved so the lint check passes cleanly.

## Problem

- `yarn lint` exits with errors, blocking CI and code quality checks.
- The exact errors are reported by ESLint and must be identified by running `yarn lint`.

## Expected Behavior

- `yarn lint` runs with no errors or warnings.
- CI lint step passes.

## Solution

- Run `yarn lint` inside the container to collect the full list of errors.
- Fix each reported error (formatting, unused variables, missing semicolons, etc.).
- Re-run `yarn lint` to confirm all errors are resolved.

## Benefits

- Enforces consistent code style across the codebase.
- Keeps CI green and prevents future regressions.

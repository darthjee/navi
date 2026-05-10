# Plan: Unify Request Handler Structure

## Overview

Move the base `RequestHandler` class from `source/lib/server/` into the shared `common/` module so that both `source` and `dev/app` extend the same base. Remove the duplicate `RequestHandler` from `dev/app` and ensure test coverage is preserved across both applications.

## Context

- `source/lib/server/RequestHandler.js` — base class used by all source server handlers.
- `dev/app` has its own parallel `RequestHandler` implementation with its own tests.
- `common/` already hosts shared utilities (e.g., `EnvResolver`, logging) consumed by both `source` and `dev/app`.
- The unified base must land in the correct subfolder under `common/` following existing conventions.

## Implementation Steps

### Step 1 — Move `RequestHandler` to `common/`

Move `source/lib/server/RequestHandler.js` to the appropriate subfolder under `common/` (e.g., `common/server/RequestHandler.js`). Keep the class unchanged at this stage.

### Step 2 — Update `source` imports

Update all files in `source/lib/server/` that import `RequestHandler` locally to import from the new `common/` path instead.

### Step 3 — Update `dev/app` to use the shared base

Update `dev/app` handlers that extend its own `RequestHandler` to import from `common/` instead. Remove the `dev/app` `RequestHandler` source file.

### Step 4 — Remove `dev/app` `RequestHandler` tests

Delete the test file(s) in `dev/app` that were dedicated to its own `RequestHandler` implementation, since that class no longer exists there.

### Step 5 — Port shared-base tests to `dev/app`

Add tests in `dev/app`'s test suite that cover the shared `RequestHandler` base class (mirroring or referencing the tests that already exist in `source/spec/lib/server/`). This preserves coverage from `dev/app`'s perspective.

### Step 6 — Update `source` spec path

If `source/spec/lib/server/RequestHandler_spec.js` still tests the base class, verify it points to the new `common/` import path.

### Step 7 — Update documentation

Update `docs/agents/architecture.md` and `docs/agents/web-server.md` (or wherever `RequestHandler` is documented) to reflect its new location in `common/`.

## Files to Change

- `source/lib/server/RequestHandler.js` — **move** to `common/<subfolder>/RequestHandler.js`
- `source/lib/server/handlers/*.js` — update import paths
- `source/spec/lib/server/RequestHandler_spec.js` — update import path
- `dev/app/<path>/RequestHandler.js` — **delete**
- `dev/app/spec/<path>/RequestHandler_spec.js` — **delete**
- `dev/app/<path>/handlers/*.js` — update import paths to `common/`
- `dev/app/spec/<path>/` — add base-class coverage tests
- `docs/agents/architecture.md` — document new `RequestHandler` location

## Notes

- Exact subfolder name under `common/` is not yet confirmed — needs codebase inspection to follow existing `common/` conventions.
- Exact paths for `dev/app`'s `RequestHandler` and its handlers are not yet confirmed.
- Each step should be its own atomic commit (implementation + tests together).
- No changes to `frontend/` are needed.

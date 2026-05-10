# Plan: Extract Common RequestHandlerExecutor

## Overview

Establish a shared `RequestHandlerExecutor` base class in `common/`, update the existing `RedirectHandlerExecutor` in `dev/app` to extend it, and refactor all `RequestHandler` implementations in both `dev/app` and `source` to extract their execution logic into dedicated `*HandlerExecutor` subclasses.

## Context

- Commit `bebce3ff` introduced `RedirectHandlerExecutor` in `dev/app` as a first instance of the executor pattern.
- No shared base class for executors exists yet — each executor is self-contained.
- The goal is to generalise this pattern so every handler delegates its execution logic to a corresponding executor, making future refactoring easier and the codebase more consistent.

## Implementation Steps

### Step 1 — Create base `RequestHandlerExecutor` in `common/`

Create `common/<subfolder>/RequestHandlerExecutor.js` with the abstract base class. Define the interface (e.g., an `execute()` method) that all concrete executors must implement.

Add the corresponding spec in `common/spec/<subfolder>/RequestHandlerExecutor_spec.js`.

### Step 2 — Update `RedirectHandlerExecutor` in `dev/app`

Update the existing `RedirectHandlerExecutor` to extend `RequestHandlerExecutor` from `common/`. Adjust its tests if needed.

### Step 3 — Extract executors for `dev/app` handlers

For each `RequestHandler` in `dev/app` (other than `RedirectRequestHandler`), create a corresponding `*HandlerExecutor` subclass of `RequestHandlerExecutor`, move the execution logic into it, and update the handler to delegate to the executor.

Add or update specs for each new executor.

### Step 4 — Extract executors for `source` handlers

For each `RequestHandler` in `source/lib/server/handlers/`, create a corresponding `*HandlerExecutor` subclass of `RequestHandlerExecutor`, move the execution logic into it, and update the handler to delegate to the executor.

Add or update specs for each new executor.

### Step 5 — Update documentation

Update `docs/agents/architecture.md` and `docs/agents/web-server.md` to document the executor pattern and the location of the shared base class.

## Files to Change

- `common/<subfolder>/RequestHandlerExecutor.js` — **new** base class
- `common/spec/<subfolder>/RequestHandlerExecutor_spec.js` — **new** spec
- `dev/app/<path>/RedirectHandlerExecutor.js` — extend shared base
- `dev/app/<path>/handlers/*.js` — extract execution logic into executors
- `dev/app/spec/<path>/handlers/*.js` — add/update executor specs
- `source/lib/server/handlers/*.js` — extract execution logic into executors
- `source/spec/lib/server/handlers/*.js` — add/update executor specs
- `docs/agents/architecture.md` — document executor pattern

## Notes

- Exact subfolder under `common/` is not yet confirmed — needs codebase inspection to follow existing conventions.
- Exact list of handlers in both `dev/app` and `source` is not yet confirmed — needs exploration.
- Steps 3 and 4 may each be broken into one atomic commit per handler (implementation + tests together).
- No `frontend/` changes are needed.

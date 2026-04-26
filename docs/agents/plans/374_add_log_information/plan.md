# Plan: Add Log Information

## Overview

Extend the logging subsystem in `source/lib/utils/logging/` to accept an optional `attributes` object alongside every log message. All classes in the chain (`Log`, `LogFactory`, `BaseLogger`, `ConsoleLogger`, `BufferedLogger`, `Logger`, `LoggerGroup`) are updated, and all specs are adjusted accordingly.

## Context

The logger currently only stores a message string per entry. Adding structured attributes enables future features such as filtering logs by job ID, resource name, or status code via an API. The change must be backwards-compatible: all existing call sites pass only a message and must continue to work unchanged.

## Implementation Steps

### Step 1 — Update `Log`

Add an `attributes` field (default `{}`) to the `Log` model so each log entry can carry structured metadata alongside `id`, `level`, and `message`.

### Step 2 — Update `LogFactory`

Update `LogFactory.build(level, message, attributes = {})` to pass `attributes` through when constructing a `Log` instance.

### Step 3 — Update `BaseLogger`

Update the internal log method signature to accept `(message, attributes = {})` and forward `attributes` to `LogFactory`.

### Step 4 — Update `ConsoleLogger` and `BufferedLogger`

Both extend `BaseLogger` — verify they delegate correctly and update `_output` if it needs to surface attributes (e.g., `ConsoleLogger` may want to print attributes alongside the message).

### Step 5 — Update `Logger` facade and `LoggerGroup`

Update all public methods (`log`, `debug`, `warn`, `error`, etc.) to accept and forward `(message, attributes = {})` to their delegates.

### Step 6 — Update specs

Update all specs under `source/spec/lib/utils/logging/` to cover the new `attributes` parameter — both the default (empty) and populated cases.

## Files to Change

- `source/lib/utils/logging/Log.js` — add `attributes` field
- `source/lib/utils/logging/LogFactory.js` — forward `attributes` to `Log`
- `source/lib/utils/logging/BaseLogger.js` — accept `attributes` in log methods
- `source/lib/utils/logging/ConsoleLogger.js` — surface attributes in output if applicable
- `source/lib/utils/logging/BufferedLogger.js` — forward attributes to stored entries
- `source/lib/utils/logging/Logger.js` — forward attributes through facade
- `source/lib/utils/logging/LoggerGroup.js` — forward attributes to all group members
- `source/spec/lib/utils/logging/*_spec.js` — update and extend specs

## Notes

- `attributes` must default to `{}` (empty object) at every layer so no existing call site breaks.
- No call sites in `source/` outside of `logging/` need to change for this issue — the new parameter is purely additive.
- Exact internal method names need to be confirmed by reading the source files before implementation.

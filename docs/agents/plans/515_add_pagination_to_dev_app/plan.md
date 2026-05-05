# Plan: Add Pagination to Dev App

## Overview

Add pagination support to the dev app JSON endpoints (`dev/app/`). Introduce a new configuration class that loads a `json` section from the dev app config file at boot, including environment variable interpolation copied from the main source app.

## Context

The dev app JSON endpoints currently return all records in a single response. The feature adds `page` and `page_size` query parameters to those endpoints. When `page_size` is omitted, a default is read from a new config section:

```yaml
json:
  perPage: 5
```

The dev app must also support environment variable interpolation in its config file (e.g. `perPage: $MY_ENV_VAR`), using the same mechanism as the main source app — copied, not shared, since they are separate applications.

## Implementation Steps

### Step 1 — Copy env var interpolation into the dev app

Copy the environment variable interpolation utility from `source/` into `dev/app/`. Adapt it to the dev app's module structure without modifying the original. This utility will be used by the new config loader.

### Step 2 — Create the dev app config classes

Create two configuration classes in `dev/app/`:

- **`JsonConfig`** — holds the `json` section of the config. Exposes a `perPage` property (defaulting to a sensible fallback if the key is absent). Applies env var interpolation to its values.
- **`AppConfig`** — top-level config class that reads the dev app config file and exposes sub-configs. Returns a `JsonConfig` instance via a `json` accessor (e.g. `AppConfig.json`).

This mirrors the pattern used in `source/` where `Config` is the top-level container for sub-models like `WorkersConfig` and `WebConfig`.

### Step 3 — Boot the config at application startup

Load the `AppConfig` instance during the dev app bootstrap (`dev/app/server.js` or equivalent entrypoint) so it is available to request handlers via `AppConfig.json`.

### Step 4 — Add pagination logic to JSON endpoints

Update the JSON endpoint handlers to:
- Read `page` (1-based) and `page_size` query parameters from the request
- Fall back to `JsonConfig.perPage` when `page_size` is not provided
- Slice the result set accordingly before responding

### Step 5 — Add tests

Write unit/integration tests for:
- `JsonConfig` (env var interpolation, default values, config file parsing)
- Updated endpoint handlers (correct slicing, param fallback, edge cases)

## Files to Change

- `dev/app/` — new `AppConfig` class (top-level config, exposes sub-configs)
- `dev/app/` — new `JsonConfig` class (holds `json` section, exposes `perPage`)
- `dev/app/` — new env var interpolation utility (copied from source)
- `dev/app/server.js` (or boot entrypoint) — instantiate and load `JsonConfig`
- `dev/app/` — JSON endpoint route handlers (apply pagination)
- `dev/app/spec/` — new spec files for `AppConfig`, `JsonConfig`, and updated endpoint handlers

## Notes

- The exact file paths inside `dev/app/` depend on the existing folder structure; the plan will be refined after inspecting the codebase.
- The env var interpolation copy must not create a shared dependency — both copies evolve independently.
- Edge cases to consider: `page` out of range (return empty array or last page?), non-numeric params (validate/ignore).

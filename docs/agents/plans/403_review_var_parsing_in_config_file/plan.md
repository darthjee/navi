# Plan: Review Var Parsing in Config File

## Overview

Centralize environment variable resolution by moving it from per-field calls scattered across
model classes to a single call in `ConfigLoader`, applied to the raw YAML string immediately
after reading the file and before parsing it.

## Context

`EnvResolver` is currently called manually in `Client.fromObject()` (and potentially other
places) on individual fields. This means fields not explicitly handled silently miss env var
substitution. Moving the resolution to the raw YAML string level makes it universal and removes
the need for any per-field wiring.

## Implementation Steps

### Step 1 — Add a full-string resolution method to `EnvResolver`

Add a new static method `EnvResolver.resolveString(raw)` (or similar name) that takes a raw
string, replaces all `$VAR` and `${VAR}` occurrences with their environment values, and returns
the resolved string.

This is simpler than the existing per-value logic: it operates on a single string rather than
recursing through an object graph.

Update `EnvResolver_spec.js` with coverage for the new method.

### Step 2 — Apply resolution in `ConfigLoader`

In `source/lib/services/ConfigLoader.js`, after reading the raw file content with
`fs.readFileSync` and before passing it to the YAML parser, call
`EnvResolver.resolveString(rawContent)`.

The YAML parser then receives an already-resolved string, so all fields — regardless of type or
nesting — automatically support `$VAR` / `${VAR}` syntax.

Update `ConfigLoader_spec.js` to assert that env vars present in the raw YAML content are
resolved before parsing.

### Step 3 — Remove per-field `EnvResolver` calls from model classes

Remove the manual `EnvResolver` calls from `Client.fromObject()`:

- `EnvResolver.resolveObject(config.headers || {})` → plain `config.headers || {}`
- `EnvResolver.resolveValue(config.base_url)` → plain `config.base_url`

Search the rest of `source/lib/` for any other `EnvResolver` usage and remove those per-field
calls as well (resolution is now handled upstream).

Update the corresponding specs to remove tests that specifically verified per-field env
resolution in model classes (those scenarios are now covered at the `ConfigLoader` level).

## Files to Change

- `source/lib/utils/EnvResolver.js` — add `resolveString(raw)` static method
- `source/lib/services/ConfigLoader.js` — call `EnvResolver.resolveString` on raw file content
- `source/lib/services/Client.js` — remove `EnvResolver.resolveObject` and `EnvResolver.resolveValue` calls from `fromObject()`
- `source/spec/lib/utils/EnvResolver_spec.js` — add coverage for `resolveString`
- `source/spec/lib/services/ConfigLoader_spec.js` — add coverage for env var resolution
- `source/spec/lib/services/Client_spec.js` — remove/update per-field env resolution tests

## Notes

- Any other model class that calls `EnvResolver` directly should also have those calls removed
  as part of Step 3 — search the codebase before opening the PR.
- The `resolveString` method may reuse the existing regex patterns already inside `EnvResolver`.
- Tests that verify env var substitution end-to-end (via `ConfigLoader`) should use a fixture
  YAML string containing `$VAR` tokens and assert the parsed result contains resolved values.

## CI Checks

Before opening a PR, run the following checks for the folders being modified:

- `source/`: `docker-compose run --rm navi_app yarn test` (CircleCI job: `source_tests`)
- `source/`: `docker-compose run --rm navi_app yarn lint` (CircleCI job: `source_lint`)

# Plan: Allow the Use of Environment Variables on Client Definitions

## Overview

Extend the existing environment variable interpolation support (already in place for client headers) to also cover `base_url` and any other string fields in client definitions. Update documentation accordingly.

## Context

`EnvResolver` already exists in `source/lib/utils/EnvResolver.js` and is already applied by `Client.fromObject()` to header values at parse time (supporting `$VAR` and `${VAR}` syntax). The client config has three fields: `base_url` (string), `timeout` (number), and `headers` (object). Only `base_url` is missing env var resolution — `timeout` is numeric so interpolation does not apply, and `headers` is already handled. `EnvResolver` already has its own spec at `source/spec/lib/utils/EnvResolver_spec.js`.

## Implementation Steps

### Step 1 — Apply `EnvResolver` to `base_url` in `Client.fromObject()`

In `source/lib/services/Client.js`, in the `fromObject()` static factory method, wrap `config.base_url` with `EnvResolver.resolveValue()` before passing it to the constructor — the same way `config.headers` is already processed via `EnvResolver.resolveObject()`.

### Step 2 — Add tests for `base_url` env var resolution in `Client_spec.js`

In `source/spec/lib/services/Client_spec.js`, add test cases verifying that `${VAR}` and `$VAR` references in `base_url` are correctly resolved from `process.env` at parse time. Also test that unset variables result in an empty string (consistent with the existing `EnvResolver` behavior).

### Step 3 — Update documentation

Add a section or note to all four documentation files describing the `${VAR_NAME}` / `$VAR_NAME` syntax for client configuration fields, with a YAML example:

- `HOW-TO-USE.md` — add a dedicated section explaining env var interpolation for client fields
- `README.md` — brief mention with example
- `source/README.md` — same as README.md
- `DOCKERHUB_DESCRIPTION.md` — same as README.md

## Files to Change

- `source/lib/services/Client.js` — apply `EnvResolver.resolveValue()` to `config.base_url` in `fromObject()`
- `source/spec/lib/services/Client_spec.js` — add tests for env var interpolation in `base_url`
- `HOW-TO-USE.md` — document env var support in client definitions
- `README.md` — document env var support in client definitions
- `source/README.md` — document env var support in client definitions
- `DOCKERHUB_DESCRIPTION.md` — document env var support in client definitions

## Notes

- `EnvResolver` already supports both `$VAR` and `${VAR}` syntax and is already tested — no changes needed there.
- The documentation update should include a clear YAML example such as:
  ```yaml
  clients:
    default:
      base_url: ${DOMAIN_BASE_URL}
  ```
- Unresolved env vars are replaced with an empty string and a warning is logged — document this behavior.

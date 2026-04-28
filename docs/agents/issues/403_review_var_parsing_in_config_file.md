# Issue: Review Var Parsing in Config File

## Description

Environment variable resolution in the config file is currently scattered across multiple places,
applied field by field. It should instead be applied once, immediately after reading the raw YAML
string and before parsing it as YAML, so that env vars are available uniformly across the entire
config file.

## Problem

- Env variable parsing is done in several locations and on a per-field basis.
- Fields that are not explicitly handled will silently miss env var substitution.
- The logic is duplicated and hard to maintain.

## Expected Behavior

- Env variable substitution is performed once, on the raw file content (string), right after
  reading the file and before passing it to the YAML parser.
- All fields in the config file automatically support `$VAR` / `${VAR}` syntax without any
  per-field handling.

## Solution

- Move env variable resolution to `ConfigLoader`, applying it to the raw YAML string before
  calling the YAML parser.
- Remove per-field `EnvResolver` calls from `Client.fromObject()` (and any other place where
  env resolution is currently done manually).

## Benefits

- Single, consistent point of env variable resolution.
- All config fields support env vars automatically, with no per-field wiring needed.
- Simpler and easier to maintain code.

---
See issue for details: https://github.com/darthjee/navi/issues/403

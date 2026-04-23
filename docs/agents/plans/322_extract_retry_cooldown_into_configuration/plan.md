# Plan: Extract retry cooldown into configuration

## Overview

Expose the retry cooldown duration as a user-configurable YAML option under `workers.cooldown` (in milliseconds), replacing any hardcoded value in the registry or engine with the value read from `WorkersConfig`.

## Context

`WorkersConfig` (in `source/lib/models/`) already models `retryCooldown` with a default of 2000 ms, but the value is not read from the YAML `workers:` block. `JobRegistryInstance.promoteReadyJobs()` uses a cooldown threshold to decide when a failed job re-enters the retry queue — this is likely where the hardcoded value lives. The fix connects the YAML → model → registry chain.

## Implementation Steps

### Step 1 — Read `cooldown` in `WorkersConfig`

Update `WorkersConfig.fromObject()` to parse the `cooldown` key from the `workers:` YAML block and store it as `retryCooldown`. Keep the existing default (2000 ms) when the key is absent.

### Step 2 — Wire `WorkersConfig` into `JobRegistry`

Ensure `JobRegistry.build(options)` receives the `WorkersConfig` instance (or at least its `retryCooldown` value) and forwards it to `JobRegistryInstance`, so `promoteReadyJobs()` uses the configured value instead of a literal.

### Step 3 — Remove the hardcoded value

Locate and remove the hardcoded cooldown literal inside `JobRegistryInstance` (or wherever it lives), replacing it with the value from `WorkersConfig`.

### Step 4 — Update tests

- Update or add a spec for `WorkersConfig` to assert that `cooldown` is parsed from the YAML object and falls back to the default.
- Update or add a spec for `JobRegistryInstance` / `JobRegistry` to assert that `promoteReadyJobs()` respects the configured cooldown.

### Step 5 — Document the new option

Add `cooldown` to whatever configuration reference exists in the docs (e.g., `docs/agents/flow.md` or a config-reference file), describing the key, its unit (ms), and its default value.

## Files to Change

- `source/lib/models/WorkersConfig.js` — parse `cooldown` from YAML, expose as `retryCooldown`
- `source/lib/registry/JobRegistryInstance.js` — use `retryCooldown` from config instead of a hardcoded value
- `source/lib/registry/JobRegistry.js` — pass `WorkersConfig` (or `retryCooldown`) through `build()`
- `source/lib/services/Application.js` or `ConfigParser.js` — verify the wiring from parsed config to `JobRegistry.build()`
- `source/spec/lib/models/WorkersConfig_spec.js` — test new YAML parsing
- `source/spec/lib/registry/JobRegistryInstance_spec.js` — test cooldown propagation
- `docs/agents/flow.md` (or equivalent) — document the new `workers.cooldown` key

## Notes

- The default must remain 2000 ms to avoid breaking existing configurations.
- `ActionProcessingJob` has no retry rights per the architecture docs — the cooldown only applies to `ResourceRequestJob` failures.
- Open question: does `WorkersConfig` already receive a raw YAML object in `fromObject()`, or does `ConfigParser` build it differently? Code inspection (Step 3 research) will confirm.

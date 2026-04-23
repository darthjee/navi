# Plan: Extract Engine Sleep into Configuration

## Overview
Remove the hardcoded sleep interval from `Engine.js` and allow it to be declared under the `workers` key in the YAML configuration file, with the current hardcoded value as the default fallback.

## Context
The `Engine` class in `source/lib/services/Engine.js` uses a hardcoded `sleepMs` value (default 500 ms) to pause between allocation ticks when all pending jobs are in cooldown. Users cannot adjust this without modifying source code. The fix adds an optional `sleep` field to the `workers:` YAML block and threads it through `WorkersConfig` into the `Engine`.

## Implementation Steps

### Step 1 — Add `sleep` to `WorkersConfig`
Update `source/lib/models/WorkersConfig.js` to accept and store a `sleep` field. Use the current hardcoded value (500 ms) as the default when the field is absent from the YAML.

### Step 2 — Parse `sleep` in `ConfigParser`
In `source/lib/services/ConfigParser.js`, read the `sleep` field from the `workers:` YAML block and pass it to `WorkersConfig` during construction/factory.

### Step 3 — Use `sleep` in `Engine`
Update `source/lib/services/Engine.js` to receive `sleepMs` from `WorkersConfig` (via the config or constructor) rather than using the hardcoded default.

### Step 4 — Add tests
- Test that `WorkersConfig` stores the configured sleep and falls back to the default.
- Test that `Engine` uses the configured sleep value when idling.
- Test that `ConfigParser` correctly parses the `sleep` field from YAML.

### Step 5 — Update sample config (if applicable)
Add a commented-out `sleep` example to any sample YAML config files in `docker_volumes/config/` to document the new option.

## Files to Change
- `source/lib/models/WorkersConfig.js` — add `sleep` field with default (500 ms)
- `source/lib/services/ConfigParser.js` — parse and pass `sleep` when building `WorkersConfig`
- `source/lib/services/Engine.js` — replace hardcoded `sleepMs` with value from config
- `source/spec/lib/models/WorkersConfig_spec.js` — test default and configured sleep
- `source/spec/lib/services/Engine_spec.js` — test that configured sleep is applied
- `source/spec/lib/services/ConfigParser_spec.js` — test YAML parsing of `sleep`

## Notes
- `WorkersConfig` already holds `quantity` and `retryCooldown` — `sleep` follows the same pattern.
- The default value must match the current hardcoded value in `Engine.js` to avoid any behaviour change for existing users.
- The `sleep` field should be optional in YAML — omitting it must be valid and must produce the default.

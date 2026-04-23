# Plan: Extract Client Timeout to Configuration

## Overview
Remove the hardcoded timeout from `Client.js` and allow it to be declared per client in the YAML configuration file, with a sensible fallback default when omitted.

## Context
The `Client` class in `source/lib/services/Client.js` currently uses a hardcoded timeout for HTTP requests. Users cannot change this without modifying source code. The fix adds an optional `timeout` field to the per-client YAML block and threads it through the config-parsing pipeline into the `Client` instance.

## Implementation Steps

### Step 1 — Add `timeout` to the client model
Update the model that represents a client's configuration (e.g., a `ClientConfig` or equivalent class in `source/lib/models/`) to accept and store a `timeout` field. Use the current hardcoded value as the default when `timeout` is not present in the YAML.

### Step 2 — Parse `timeout` in `ConfigParser`
In `source/lib/services/ConfigParser.js`, read the `timeout` field from each client's YAML entry and pass it to the client model's factory method (`fromObject()`).

### Step 3 — Use `timeout` in `Client`
Update `source/lib/services/Client.js` to receive the timeout from its configuration instead of using a hardcoded value, and apply it to the Axios request options.

### Step 4 — Add tests
- Test that the client model stores the configured timeout and falls back to the default.
- Test that `Client` applies the configured timeout to the HTTP request.
- Test that `ConfigParser` correctly parses the `timeout` field from YAML.

### Step 5 — Update sample config (if applicable)
Add a commented-out `timeout` example to any sample YAML config files in `docker_volumes/config/` to document the new option.

## Files to Change
- `source/lib/models/<ClientConfig or equivalent>.js` — add `timeout` field with default
- `source/lib/services/ConfigParser.js` — parse and pass `timeout` when building client instances
- `source/lib/services/Client.js` — replace hardcoded timeout with the configured value
- `source/spec/lib/models/<ClientConfig_spec>.js` — test default and configured timeout
- `source/spec/lib/services/Client_spec.js` — test that configured timeout is applied
- `source/spec/lib/services/ConfigParser_spec.js` — test YAML parsing of `timeout`

## Notes
- The exact model class name for client config is unknown until the code is read — may be inline in `ConfigParser` rather than a dedicated model.
- The default timeout value should match the current hardcoded value in `Client.js` to avoid any behaviour change for existing users.
- The `timeout` field should be optional in YAML — omitting it must be valid and must produce the default.

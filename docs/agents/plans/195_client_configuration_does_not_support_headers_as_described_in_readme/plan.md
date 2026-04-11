# Plan: Client Configuration Does Not Support Headers as Described in README

## Overview

Add `headers` support to the client configuration so that custom HTTP headers can be passed per-client via YAML config. Header values must support environment variable references for runtime flexibility. Update all relevant documentation to reflect the new behavior.

## Context

The README implies that the client configuration accepts `headers`, but the current implementation ignores them. The `Client` service performs HTTP requests via Axios without forwarding any configured headers. This plan introduces headers at the config/model level, wires them through to the HTTP request, and aligns the docs.

## Implementation Steps

### Step 1 — Add headers to the client model

Create or update the model that represents a named client's configuration (likely a `ClientConfig` class in `source/lib/models/`) to hold a `headers` map.

- Add a `headers` field (default: `{}`).
- Support environment variable interpolation for header values: if a value matches `$ENV_VAR_NAME` or `${ENV_VAR_NAME}`, resolve it from `process.env` at parse time.
- Expose a static `fromObject()` factory method following existing model conventions.

### Step 2 — Update ConfigParser to read headers from YAML

In `source/lib/services/ConfigParser.js`, extend the client-parsing logic to read the `headers` key from each client entry and pass it to the client model factory.

### Step 3 — Update Client service to forward headers

In `source/lib/services/Client.js`, update the `perform(resourceRequest, params)` method (or its Axios call) to merge the client's configured headers into every request.

### Step 4 — Add tests

Add or update specs for:
- The client model: headers are stored, static values pass through, env var references are resolved.
- `ConfigParser`: headers from YAML are parsed and forwarded to the model.
- `Client`: configured headers are included in outgoing requests.

Spec files follow the `source/spec/lib/<mirror-path>/<ClassName>_spec.js` naming convention.

### Step 5 — Update README

Update the README to include a realistic YAML example showing the `headers` field, including an env-var-backed header value.

### Step 6 — Update agent documentation

Update the relevant files under `docs/agents/` to reflect the new capability:
- `docs/agents/architecture.md` — update the `Client` and any client model descriptions.
- `docs/agents/flow.md` — if headers resolution is described as part of the config-loading flow, update accordingly.

## Files to Change

- `source/lib/models/ClientConfig.js` (new or existing) — add `headers` field with env var interpolation
- `source/lib/services/ConfigParser.js` — parse `headers` from YAML client entries
- `source/lib/services/Client.js` — forward configured headers to Axios requests
- `source/spec/lib/models/ClientConfig_spec.js` (new or existing) — unit tests for headers
- `source/spec/lib/services/ConfigParser_spec.js` — test headers parsing
- `source/spec/lib/services/Client_spec.js` — test headers forwarding
- `README.md` — add `headers` YAML example
- `docs/agents/architecture.md` — update `Client` and client model descriptions
- `docs/agents/flow.md` — update config-loading flow if applicable

## Notes

- Environment variable resolution should happen at parse time (when the YAML is loaded), not at request time, to keep `Client.perform()` side-effect free.
- If a referenced env var is not set, decide whether to throw a descriptive error or silently omit the header — this should be confirmed before implementation.
- Existing client config entries without `headers` must continue to work (backward-compatible default of `{}`).

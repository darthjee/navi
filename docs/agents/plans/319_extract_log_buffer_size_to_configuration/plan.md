# Plan: Extract Log Buffer Size to Configuration

## Overview

Extract the hardcoded log buffer size (`100`) from `LogBuffer.js` and `BufferedLogger.js` into a new `LogConfig` model, read from the YAML configuration under the `log:` key. The value defaults to `100` when the key is absent.

## Context

Currently `LogBuffer` and `BufferedLogger` both hardcode a retention limit of `100` log entries. There is no way for operators to tune this value without editing source code. The project already follows the pattern of wrapping config sections in dedicated model classes (`WorkersConfig`, `WebConfig`), so a `LogConfig` model is the natural fit.

## Implementation Steps

### Step 1 — Create `LogConfig` model

Create `source/lib/models/LogConfig.js` following the same pattern as `WorkersConfig`:

- Constructor accepts `{ size }` with a default of `100`.
- Static factory method `LogConfig.fromObject(obj)` parses the raw YAML object.
- Exposes a `size` getter.
- Add the corresponding spec `source/spec/lib/models/LogConfig_spec.js`.

### Step 2 — Wire `LogConfig` into `Config`

Update `source/lib/models/Config.js` to:

- Accept and store a `LogConfig` instance alongside the existing `WorkersConfig` and `WebConfig`.
- Expose it via a `logConfig` getter.

Update the corresponding spec.

### Step 3 — Parse `log:` key in `ConfigParser`

Update `source/lib/services/ConfigParser.js` to:

- Read the optional top-level `log:` key from the parsed YAML.
- Pass it to `LogConfig.fromObject()` (or use the default if absent).
- Forward the resulting `LogConfig` to `Config`.

Update the corresponding spec.

### Step 4 — Thread `logConfig.size` into the logging subsystem

Update the logger initialisation path (likely in `Application`) to:

- Retrieve `config.logConfig.size`.
- Pass the value down to `BufferedLogger` (and through to `LogBuffer`) instead of relying on the hardcoded default.

Update specs as needed.

### Step 5 — Remove the hardcoded default from `LogBuffer` / `BufferedLogger`

Once the value is always supplied from configuration, replace the hardcoded `100` with a parameter received at construction time. Keep `100` only as the `LogConfig` default (single source of truth).

## Files to Change

- `source/lib/models/LogConfig.js` — new model (create)
- `source/spec/lib/models/LogConfig_spec.js` — new spec (create)
- `source/lib/models/Config.js` — add `logConfig` field
- `source/spec/lib/models/Config_spec.js` — update spec
- `source/lib/services/ConfigParser.js` — parse `log.size`
- `source/spec/lib/services/ConfigParser_spec.js` — update spec
- `source/lib/services/Application.js` — thread size to logger
- `source/spec/lib/services/Application_spec.js` — update spec
- `source/lib/utils/logging/LogBuffer.js` — receive size as param
- `source/spec/lib/utils/logging/LogBuffer_spec.js` — update spec
- `source/lib/utils/logging/BufferedLogger.js` — forward size to LogBuffer
- `source/spec/lib/utils/logging/BufferedLogger_spec.js` — update spec

## Notes

- The `log:` key should be entirely optional; omitting it must yield the same behaviour as today.
- Follow the `WorkersConfig` / `WebConfig` pattern for the new model.
- Single source of truth for the default value: only `LogConfig` knows `100`; `LogBuffer` and `BufferedLogger` receive it as a required (or defaulted) constructor argument.

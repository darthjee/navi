# Issue: Extract retry cooldown into configuration

## Description

The cooldown duration before a failed job is retried is currently hardcoded in the application. It should be exposed as a configurable option in the YAML configuration file.

## Problem

- The retry cooldown value is hardcoded, making it impossible to tune without modifying source code.
- Users cannot adjust the delay between retry attempts to suit their environment or use case.

## Expected Behavior

- Users can specify the retry cooldown in the `workers` section of the YAML config:

```yaml
workers:
  cooldown: 5000
```

## Solution

- Identify where the cooldown value is hardcoded in the engine/worker logic.
- Add a `cooldown` field (in milliseconds) to the `workers` configuration schema.
- Read and apply the configured value at runtime, falling back to the current default if not specified.
- Document the new option in the configuration reference.

## Benefits

- Gives operators control over retry timing without changing source code.
- Makes retry behaviour consistent with the rest of the configurable worker pool settings.

---
See issue for details: https://github.com/darthjee/navi/issues/322

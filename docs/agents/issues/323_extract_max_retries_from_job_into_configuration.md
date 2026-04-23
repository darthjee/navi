# Issue: Extract max retries from job into configuration

## Description

The maximum number of retries for a failed job is currently hardcoded in the application. It should be exposed as a configurable option in the YAML configuration file under the `workers` section.

## Problem

- The max-retries value is hardcoded, making it impossible to tune without modifying source code.
- Users cannot adjust how many times a job is retried before it is marked as dead, to suit their environment or use case.

## Expected Behavior

- Users can specify the maximum number of retries in the `workers` section of the YAML config:

```yaml
workers:
  max-retries: 5
```

## Solution

- Identify where the max-retries value is hardcoded in the job or registry logic.
- Add a `max-retries` field to the `workers` configuration schema (mapped to `maxRetries` in `WorkersConfig`).
- Read and apply the configured value at runtime, falling back to the current default if not specified.
- Document the new option in the configuration reference.

## Benefits

- Gives operators control over retry limits without changing source code.
- Makes retry behaviour consistent with the rest of the configurable worker pool settings.

---
See issue for details: https://github.com/darthjee/navi/issues/323

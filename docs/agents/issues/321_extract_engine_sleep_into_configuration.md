# Issue: Extract Engine Sleep into Configuration

## Description
The Engine's sleep interval between ticks is currently hardcoded. It should be extracted to the YAML configuration under the `workers` key so users can tune it without modifying source code.

## Problem
- The sleep duration used by the `Engine` between allocation ticks is hardcoded and cannot be changed without touching source code.
- Users running Navi in environments that require faster or slower polling have no way to adjust this value.

## Expected Behavior
- The YAML configuration should accept an optional `sleep` field under the `workers` key.
- Example:
  ```yaml
  workers:
    sleep: 500
  ```
- When `sleep` is omitted, a sensible default should be used (e.g., the current hardcoded value of 500 ms).

## Solution
- Add a `sleep` field to `WorkersConfig` (the model that holds worker pool configuration).
- Parse it from the YAML `workers:` block in `ConfigParser`.
- Pass it through to the `Engine` so it uses the configured value instead of the hardcoded one.
- Add tests covering both the configured and default-sleep cases.

## Benefits
- Gives users control over the engine polling interval without touching source code.
- Makes Navi easier to tune for different workloads and environments.

---
See issue for details: https://github.com/darthjee/navi/issues/321

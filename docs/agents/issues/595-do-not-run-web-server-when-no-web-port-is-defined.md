# Issue: Do Not Run Web Server When No Web Port Is Defined

## Description

When navi runs, if a `web.port` key exists in the configuration with a null (or equivalent falsy) value, the web server still starts and keeps the process alive indefinitely. This causes problems in CI environments where the process never exits after tests complete.

## Problem

- Navi starts the web server even when `web.port` is set to `null`, `""` (blank), `false`, or `"false"` in the configuration
- In CI, this keeps the process running after tests are done, blocking pipelines

## Expected Behavior

- Navi should treat `web.port` values of `null`, `""` (blank), `false`, or `"false"` as equivalent to "no port configured"
- When no valid web port is defined, the web server should not start

## Solution

- Add validation for the `web.port` configuration value
- Treat `null`, `""`, `false`, and `"false"` as absent/unset values
- Skip web server startup when the port resolves to a falsy/empty value

## Benefits

- CI pipelines will exit cleanly after tests complete
- Prevents accidental web server startup when port is explicitly disabled in config

---
See issue for details: https://github.com/darthjee/navi/issues/595

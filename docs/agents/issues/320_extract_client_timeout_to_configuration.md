# Issue: Extract Client Timeout to Configuration

## Description
The HTTP client timeout is currently hardcoded in `Client.js`. It should be extracted to the YAML configuration so users can customize the timeout per client.

## Problem
- The timeout value in `Client.js` is hardcoded and cannot be changed without modifying source code.
- Users with slow upstream services or strict SLA requirements have no way to tune the timeout.

## Expected Behavior
- The YAML configuration should accept an optional `timeout` field under each client definition.
- Example:
  ```yaml
  clients:
    default:
      timeout: 5000
  ```
- When `timeout` is omitted, a sensible default should be used (e.g., the current hardcoded value).

## Solution
- Read the `timeout` field from the client configuration in the YAML parser/loader.
- Pass it through to the `Client` instance when constructing it.
- Fall back to a default value if `timeout` is not provided.
- Add tests covering both the configured and default-timeout cases.

## Benefits
- Gives users control over request timeout without touching source code.
- Makes Navi more flexible for different target environments.

---
See issue for details: https://github.com/darthjee/navi/issues/320

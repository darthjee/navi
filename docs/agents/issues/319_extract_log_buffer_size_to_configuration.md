# Issue: Extract Log Buffer Size to Configuration

## Description

The log buffer size in `LogBuffer.js` is currently hardcoded to `100`. This value should be extracted to the YAML configuration file so users can tune it without modifying source code.

## Problem

- `source/lib/utils/logging/LogBuffer.js` (line 17) has `retention: 100` hardcoded.
- `source/lib/utils/logging/BufferedLogger.js` (line 17) also defaults to `100`.
- There is no way to adjust the log buffer size through configuration.

## Expected Behavior

- Users can configure the log buffer size via the YAML config:

```yaml
log:
  size: 100
```

- The application reads this value at startup and passes it to `LogBuffer` / `BufferedLogger`.
- The hardcoded `100` becomes the fallback default when the key is absent.

## Solution

- Add `log.size` to the config schema and documentation.
- Read the value in the logger initialisation path and forward it to `LogBuffer` / `BufferedLogger`.
- Remove (or keep as fallback) the hardcoded `100`.

## Benefits

- Allows operators to increase retention for debugging or reduce it to save memory.
- Consistent with the project's goal of keeping tuneable values in configuration.

---
See issue for details: https://github.com/darthjee/navi/issues/319

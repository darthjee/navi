# Issue: Client Configuration Does Not Support Headers as Described in README

## Description

The README documents that the client configuration accepts headers, but the current implementation does not allow headers to be passed as an argument. This discrepancy is misleading and limits the flexibility of the client configuration.

## Problem

- The client configuration does not accept a `headers` argument despite the README implying it does.
- Users cannot pass custom headers through client configuration.
- Environment variables cannot be used as header values, reducing configurability.
- The mismatch between documentation and implementation misleads users.

## Expected Behavior

- The client configuration should accept a `headers` argument.
- Header values should support environment variable references, allowing runtime customization based on the running environment.

## Solution

1. Update the client configuration implementation to accept a `headers` argument.
2. Ensure headers can be provided directly as static values or resolved from environment variables.
3. Update the README with a realistic usage example reflecting the new behavior.
4. Add tests to verify that headers (including those derived from environment variables) are correctly handled.

## Benefits

- Aligns implementation with documented behavior, eliminating user confusion.
- Enables advanced integration scenarios that require custom request headers (e.g., authentication tokens, API keys).
- Makes header configuration more flexible by supporting environment variable interpolation.

---
See issue for details: https://github.com/darthjee/navi/issues/195

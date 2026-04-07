# Reasoning: Add Logs to Dev App

## Approach

Use `morgan` (the de-facto Express logging middleware) with the `combined` format. This matches the Apache Combined Log style requested and requires minimal code: one `yarn add` and two lines in `app.js`. No custom middleware needed.

## Constraints

- `morgan` is not yet in `package.json` — must be added as a runtime dependency.
- The middleware must be mounted before the router so all requests (including 404s) are logged.
- Tests will emit log lines to stdout during test runs — harmless, no assertions are affected.

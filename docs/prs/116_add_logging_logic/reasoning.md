# Reasoning: Add Logging Logic

## Approach

Following the plan exactly: create a `Logger` class in `source/lib/utils/Logger.js` that reads `LOG_LEVEL` from the environment, write Jasmine specs, and replace the existing `console.error` call in `Worker.js`. This approach introduces structured logging without changing the dev-app.

## Constraints

- No changes to `dev/` or `new-dev/` directories.
- Logger must follow the same ES6 with private fields, JSDoc, and Jasmine 5 conventions as the rest of the codebase.
- `LOG_LEVEL` is read at instantiation time; an optional constructor parameter enables testability without mutating `process.env`.

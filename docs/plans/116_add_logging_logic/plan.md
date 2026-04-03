# Plan: Add Logging Logic

## Overview

Introduce a `Logger` utility class to the main Navi application (`source/`) that filters log output based on a configurable `LOG_LEVEL` environment variable. The dev-app is not affected.

## Context

- The codebase currently has a single logging call: `console.error(...)` in `source/lib/models/Worker.js:43`.
- Environment variables are not yet used anywhere in `source/lib/`; the `LOG_LEVEL` env var introduces this pattern for the first time.
- All classes follow ES6 with private fields, JSDoc, and are tested with Jasmine 5. The Logger must follow the same conventions.
- The natural home for the Logger is `source/lib/utils/`, alongside other utilities like `Queue.js`.

## Implementation Steps

### Step 1 — Create `source/lib/utils/Logger.js`

Create an ES6 class with:
- A private field `#level` initialized from `process.env.LOG_LEVEL`, defaulting to `'info'` if not set.
- A private field `#levels` mapping level names to numeric priorities: `{ debug: 0, info: 1, warn: 2, error: 3, silent: 4 }`.
- A private method `#shouldLog(level)` that returns `true` when the given level's priority is >= the configured threshold.
- Public methods `debug(message)`, `info(message)`, `warn(message)`, `error(message)`, each delegating to the appropriate `console.*` method only when `#shouldLog` passes.

```js
// source/lib/utils/Logger.js
export class Logger {
  #level;
  #levels = { debug: 0, info: 1, warn: 2, error: 3, silent: 4 };

  constructor() {
    this.#level = process.env.LOG_LEVEL ?? 'info';
  }

  #shouldLog(level) { ... }
  debug(message) { ... }
  info(message)  { ... }
  warn(message)  { ... }
  error(message) { ... }
}
```

### Step 2 — Write specs in `source/spec/utils/Logger_spec.js`

Cover all scenarios with Jasmine:
- Each public method emits output when the level meets the threshold.
- Each public method is silent when the level is below the threshold.
- `LOG_LEVEL=silent` suppresses all output.
- Default level (`info`) is used when `LOG_LEVEL` is unset.
- Spy on `console.debug`, `console.info`, `console.warn`, `console.error` to assert calls without real output.

### Step 3 — Update `source/lib/models/Worker.js`

Replace the existing `console.error(...)` call (line 43) with a Logger instance:
- Instantiate `new Logger()` in the constructor (or accept it via dependency injection consistent with how other services receive collaborators).
- Call `this.#logger.error(...)` in place of `console.error(...)`.

## Files to Change

- `source/lib/utils/Logger.js` — **new file**: the Logger class
- `source/spec/utils/Logger_spec.js` — **new file**: Jasmine specs for Logger
- `source/lib/models/Worker.js` — replace `console.error` with Logger call

## Notes

- `LOG_LEVEL` is read at instantiation time. If the class needs to be testable without mutating `process.env`, consider accepting the level as an optional constructor parameter (fallback to env var), which aligns with Jasmine's spy-based testing approach.
- `silent` is a useful sentinel level to suppress all output in CI/test environments.
- No changes to `dev/`, `new-dev/`, or any configuration YAML files are needed.

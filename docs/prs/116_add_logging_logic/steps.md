# Steps: Add Logging Logic

## [ ] Step 1 — Create `source/lib/utils/Logger.js`

Implement ES6 class with private `#level` and `#levels` fields, `#shouldLog(level)` private method, and public `debug`, `info`, `warn`, `error` methods delegating to the appropriate `console.*`.

## [ ] Step 2 — Write `source/spec/utils/Logger_spec.js`

Jasmine specs covering each public method at threshold, below threshold, `LOG_LEVEL=silent`, and default (`info`) when env var is unset. Spy on `console.*` methods.

## [ ] Step 3 — Update `source/lib/models/Worker.js`

Replace `console.error(...)` at line 43 with a `Logger` instance call (`this.#logger.error(...)`).

## [ ] Step 4 — Open PR

Open PR via `gh pr create` targeting `add-logs` branch.

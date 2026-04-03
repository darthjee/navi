# Relevant Files: Add Logging Logic

## Files to create

- `source/lib/utils/Logger.js` — new Logger class with level-based filtering
- `source/spec/utils/Logger_spec.js` — Jasmine specs for Logger

## Files to change

- `source/lib/models/Worker.js:43` — replace `console.error(...)` with Logger instance call

## Files for context only

- `source/lib/utils/Queue.js` — sibling utility to follow same conventions
- `docs/issues/116_add_logging_logic.md` — issue specification
- `docs/plans/116_add_logging_logic/plan.md` — implementation plan

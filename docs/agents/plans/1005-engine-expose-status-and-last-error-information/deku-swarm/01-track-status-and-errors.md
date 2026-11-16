# Track status, timestamps and last error

Extend `deku-swarm/lib/services/Engine.js`:

- New private fields: `#startedAt = null`, `#stoppedAt = null`, `#lastTickAt = null`, `#lastError = null`, `#crashed = false`, `#everStarted = false` (or derive `idle` from `#startedAt === null`). Reuse the existing `#running`, `#stopped`, `#paused`, `#draining`.
- `start()`:
  - At entry: `#startedAt = Date.now()`, `#stoppedAt = null`, `#crashed = false` (keep `#lastError`).
  - Set `#lastTickAt = Date.now()` once per loop iteration (top of the loop body, before the `#draining` branch).
  - Wrap the loop in `try { ... } catch (error) { #recordCrash(error); throw error; } finally { #stoppedAt = Date.now(); ...existing drain settling... }`.
- `#recordCrash(error)`: set `#crashed = true`, `#lastError = { name: error?.name ?? 'Error', message: error?.message ?? String(error), at: Date.now() }`, then emit `'crash'` with the original error inside its own `try/catch` so a throwing listener cannot replace the rethrown error.
- `get status()`: implements the precedence from the shared contract.
- `snapshot()`: returns `{ status, startedAt, stoppedAt, lastTickAt, lastError: lastError ? { ...lastError } : null }`.
- JSDoc for `status`, `snapshot()`, the `'crash'` event (mention it on `on()`/class doc), and update the class doc comment.

Keep methods small to satisfy lint/complexity rules (extract `#runningStatus()` if needed).

## Files to Change
- `deku-swarm/lib/services/Engine.js` — new fields, `status` getter, `snapshot()`, crash recording and `'crash'` emit, timestamp tracking.

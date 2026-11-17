# WorkersConfig retention

Add an optional `retention` constructor parameter to `WorkersConfig` and store a normalized copy on `this.retention`:

```js
constructor({ quantity = 1, retry_cooldown: retryCooldown = 2000, sleep = 500, 'max-retries': maxRetries = 3, retention } = {}) {
  ...
  this.retention = WorkersConfig.#normalizeRetention(retention);
}

static #normalizeRetention(retention) {
  if (retention == null) return undefined;
  const entries = Object.entries(retention).filter(([, value]) => value != null);
  return entries.length ? Object.fromEntries(entries) : undefined;
}
```

- `null`/`undefined` values are dropped (unset env vars interpolate to `null`); `0` is kept.
- Unknown keys are kept so deku-swarm rejects typos at boot.
- Update the JSDoc (`config.retention`, `config.retention.finished`, `config.retention.dead`).

Specs (`WorkersConfig_spec.js`):
- No `retention` → `undefined`.
- `{ finished: 100 }` → exactly `{ finished: 100 }` (assert `toEqual` and `Object.keys`).
- `{ dead: 50 }` → exactly `{ dead: 50 }`.
- `{ finished: 100, dead: 50 }` → both.
- `retention: null` → `undefined`.
- `{ finished: null, dead: null }` → `undefined`; `{ finished: 100, dead: null }` → `{ finished: 100 }`.
- `{ finished: 0 }` → `{ finished: 0 }`.
- `{ finshed: 1 }` → `{ finshed: 1 }` (preserved).
- Existing defaults (`quantity`, `retryCooldown`, `sleep`, `maxRetries`) unchanged.

## Files to Change
- `source/lib/models/configs/WorkersConfig.js` — accept and normalize `retention`.
- `source/spec/lib/models/configs/WorkersConfig_spec.js` — cases above.

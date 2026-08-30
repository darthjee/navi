# Add emit.retries/emit.cooldown config and validation

Extend the existing `emit:` YAML block with optional per-resource retry overrides, validated eagerly at construction time — same pattern `ResourceRequestEmit` already uses for `method`/`url`.

```yaml
emit:
  client: some_client
  method: POST
  url: /some/endpoint
  status: 200
  retries: 5       # optional — overrides EmitJob's default (5) for this resource
  cooldown: 5000   # optional — overrides EmitJob's default (5000ms) for this resource
```

- New exceptions `InvalidEmitRetries` and `InvalidEmitCooldown` (one per validation, matching `InvalidEmitMethod`/`MissingEmitUrl`'s existing shape) — thrown for negative or non-numeric values. `retries: 0` is explicitly valid (one attempt, no retries).
- `ResourceRequestEmit`'s constructor accepts optional `retries`/`cooldown`, validates them, and exposes them via getters (e.g. `get retries()`, `get cooldown()`) — `undefined` when not set in the YAML, letting `EmitJob` (step 03) apply its own default.

## Files to Change

- `source/lib/exceptions/config/InvalidEmitRetries.js` (new)
- `source/lib/exceptions/config/InvalidEmitCooldown.js` (new)
- `source/lib/models/request/ResourceRequestEmit.js` — accept, validate, and expose `retries`/`cooldown`.

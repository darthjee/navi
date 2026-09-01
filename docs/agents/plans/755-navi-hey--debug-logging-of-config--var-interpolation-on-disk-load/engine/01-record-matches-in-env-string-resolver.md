# Record matches in EnvStringResolver

Port the client's instance-based `matches` recording
(`clients/node/lib/EnvStringResolver.js`) into the engine's
`EnvStringResolver`. Today it's used only via the static
`EnvStringResolver.resolve(content)` shortcut and returns just the resolved
string; after this step it also accumulates, per instance, one entry per
`$VAR`/`${VAR}` occurrence encountered during that `resolve()` call — in match
order, not deduped — so a caller can log per-occurrence detail after the fact.

Add a module-level `HASH_LENGTH = 12` constant and a private `#hash(value)`
helper using `createHash('sha256').update(value).digest('hex').slice(0,
HASH_LENGTH)` (`node:crypto`). In the constructor, initialize
`this.matches = []`. In `resolve()`, for each match push
`{ varName, defined: true, length: resolved.length, hash: this.#hash(resolved) }`
when the variable is set, or `{ varName, defined: false }` when it isn't —
before the existing `Logger.warn('Environment variable not defined: <name>')`
call and substitution, which stay exactly as they are today. `resolve()`
keeps returning only the resolved string; `matches` is purely an added
instance property, not a return-value change.

## Files to Change

- `source/lib/common/utils/env_resolver/EnvStringResolver.js` — add the
  `HASH_LENGTH` constant, `node:crypto` import, `#hash` private method,
  `this.matches = []` in the constructor, and match recording inside
  `resolve()`, mirroring `clients/node/lib/EnvStringResolver.js` field-for-field.

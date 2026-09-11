# Extend ApiEngineStartHandler validation and response shape

Extend `#validTarget`/`#validTargets` to accept the new shapes, and thread the
parsed `parameters` through to `ResourceEnqueuer#enqueue` (step 02) inside
`#aggregate`.

**Scope note:** the parameterized capability applies only to `targets[]`
entries. The pre-existing top-level `resources`/no-`targets` fallback
(`#topLevelResources()`, used when `targets` is omitted entirely) is **not**
extended — it keeps accepting only a plain array of strings, exactly as today.
Do not add a top-level `parameters` sibling to that fallback.

## Validation changes

- Add a `#validParameters(value)` helper: `true` only for a plain object (not
  array, not `null`) whose every value is `string`, `number`, `boolean`, or
  `null`. Reused for both target-level `parameters` and per-resource
  `parameters`.
- `#validTarget(target)`: keep the existing `namespace` check unchanged. Add: if
  `target.parameters !== undefined`, it must pass `#validParameters`. Replace the
  `resources` array check so each entry passes either:
  - the existing bare-string check (`typeof entry === 'string'`) — **unchanged,
    do not tighten to non-empty**, preserving today's exact acceptance of an
    empty string (it already resolves to a harmless `not_found` skip at enqueue
    time); or
  - an object check: `entry` is a plain object, `typeof entry.name === 'string'
    && entry.name.trim()` (non-empty/non-blank, unlike the bare-string case),
    and (`entry.parameters === undefined || #validParameters(entry.parameters)`).
    Unknown keys on the object are ignored, not rejected.
- Any failure anywhere in this still routes to the existing `#badRequest(...)`
  400 path — no change to the response body shape for a validation failure.

## Threading parameters through `#aggregate`

Destructure `parameters` alongside `namespace`/`resources` in the `reduce`
callback and pass it through:

```js
const result = resources === undefined
  ? enqueuer.enqueueAll()
  : enqueuer.enqueue(resources, { parameters: parameters ?? {} });
```

No other change to `#aggregate`'s accumulation logic — `result.skippedResources`
already carries the optional `parameters` key produced by step 02, and it flows
through unchanged.

## Files to Change

- `source/lib/server/handlers/api/ApiEngineStartHandler.js` — the changes above.
- `source/spec/lib/server/handlers/api/ApiEngineStartHandler_spec.js` — cover:
  a target with an object-form `resources[]` entry carrying `parameters` is
  accepted and forwarded to `ResourceEnqueuer#enqueue` with the right merged
  shape; a target-level `parameters` object is accepted and forwarded; a
  non-object `target.parameters` (e.g. an array or string) → 400; a resource
  object missing/blank `name` → 400; a resource object with a non-plain-object
  `parameters` → 400; a parameter value that's an object or array → 400; an
  unknown key on a resource object is ignored, not rejected; a plain
  bare-string-only `resources[]` request (no `parameters` anywhere) is
  unaffected — same 400/200 outcomes as before this change; the top-level
  `resources` (no `targets`) fallback still only accepts a bare-string array.

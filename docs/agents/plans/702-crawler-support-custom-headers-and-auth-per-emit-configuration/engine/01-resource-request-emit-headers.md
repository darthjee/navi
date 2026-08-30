# Add `headers` to ResourceRequestEmit

Accept an optional `headers` map on the `emit` config, validated eagerly like the other
emit attributes, and expose it via a getter.

## Behaviour

- `new ResourceRequestEmit({ ..., headers })`:
  - `headers` omitted / `undefined` → the emit exposes `headers` as `{}` (empty object).
  - `headers` given → must be a non-null plain object (not an array). Each value must be
    string-coercible (`string` / `number` / `boolean`). On violation, throw a new
    `InvalidEmitHeaders` error.
  - Store the object as-is (values are already env-resolved by `ConfigIncluder`); do
    **not** coerce values to `String` here — keep it consistent with how `Client`
    stores `this.headers` verbatim. (Coercion, if any, happens at the axios boundary.)
- Add a `get headers()` getter returning the stored object.
- `fromObject` needs no change (it forwards the whole raw object), but confirm `headers`
  is destructured in the constructor signature.
- Update the constructor JSDoc with the new `@param {object} [attributes.headers]` line
  (jsdoc runs `--pedantic` in CI).

## `InvalidEmitHeaders` exception

Mirror `source/lib/exceptions/config/InvalidEmitRetries.js` exactly:

- Extends `AppError`.
- Message: `` `Invalid emit headers: ${JSON.stringify(headers)}. Expected a map of string values` ``
- Stores `this.headers = headers`.
- File-level JSDoc block with `@author darthjee`.

## Specs

`source/spec/lib/models/request/ResourceRequestEmit_spec.js` — add a `describe('headers')`
block alongside the existing `retries` / `cooldown` blocks:
- not given → exposes `{}`
- given a valid map (incl. a `$VAR`-looking literal string, to document that resolution
  is upstream) → exposes it unchanged
- given an array → throws `InvalidEmitHeaders`
- given a non-object primitive → throws `InvalidEmitHeaders`
- given an object with a nested-object value → throws `InvalidEmitHeaders`

`source/spec/lib/exceptions/config/InvalidEmitHeaders_spec.js` — new file, mirror
`InvalidEmitRetries_spec.js` (message text + `error.headers` retained + `instanceof AppError`).

## Files to Change

- `source/lib/models/request/ResourceRequestEmit.js` — constructor param + validation + `headers` getter + JSDoc.
- `source/lib/exceptions/config/InvalidEmitHeaders.js` — new exception class.
- `source/spec/lib/models/request/ResourceRequestEmit_spec.js` — `headers` describe block.
- `source/spec/lib/exceptions/config/InvalidEmitHeaders_spec.js` — new spec.
- `source/spec/support/factories/ResourceRequestEmitFactory.js` — allow a `headers` override to be passed through (check the factory shape; only touch if it whitelists keys).

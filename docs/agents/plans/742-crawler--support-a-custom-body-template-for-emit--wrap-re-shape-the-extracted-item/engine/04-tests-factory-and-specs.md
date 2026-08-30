# Tests: factory and specs

Extend the existing test factory and specs to cover `bodyTemplate`/`resolveBody`, following the same style already used for `headers`/`#parseHeaders`.

## ResourceRequestEmitFactory

- Add an optional `body_template = undefined` param to `ResourceRequestEmitFactory.build`, threaded into `new ResourceRequestEmit({ ..., body_template })`; update its JSDoc `@param` block.

## ResourceRequestEmit_spec.js

Add coverage (mirroring the existing `headers` describe blocks) for:
- Constructor: no `body_template` → `bodyTemplate` is `undefined`; a valid plain-object template → stored and returned as-is by the `bodyTemplate` getter; a valid array template → same; an invalid template (string, number, `null` explicitly passed, or a non-plain object like a class instance) → throws `InvalidEmitBodyTemplate`.
- `resolveBody(item)`:
  - No template configured → returns `item` unchanged (`toBe`, same reference).
  - Whole-token value (`{:field}`) → splices the field's actual value, preserving type (test with a string, a number, a nested object, and an array field).
  - `{:.}` whole-token → splices the entire `item`.
  - Token embedded in a longer string (`"note {:id} extracted"`) → string-interpolated, non-string field values stringified.
  - Missing/unresolvable path → whole-token case returns the literal token string; interpolated case leaves the literal token embedded in the surrounding string.
  - Nested dot-path (`{:address.city}`) → resolves through nested objects.
  - Nested template structure (object containing arrays containing objects, etc.) → recurses and renders every string leaf.
  - Non-string leaf values in the template (numbers, booleans, `null`) → pass through unchanged.

## EmitJob_spec.js

- Add a case where the `ResourceRequestEmit` used to build the job has a `body_template` configured: assert the client's `emit` is called with the rendered body (not the raw item) as the third argument.
- Add/confirm a case with no `body_template`: assert `emit` is still called with the raw item, unchanged from today's behavior.

## Files to Change

- `source/spec/support/factories/ResourceRequestEmitFactory.js`
- `source/spec/lib/models/request/ResourceRequestEmit_spec.js`
- `source/spec/lib/jobs/EmitJob_spec.js`

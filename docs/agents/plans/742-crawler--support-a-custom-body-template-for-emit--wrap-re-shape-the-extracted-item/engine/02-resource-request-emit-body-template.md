# ResourceRequestEmit: bodyTemplate attribute and resolveBody rendering

`ResourceRequestEmit` gains a `body_template` constructor param (snake_case, matching the YAML key and the existing `paginated_actions`-style convention — see `ResourceRequest`), validated eagerly, exposed as `bodyTemplate`, and a `resolveBody(item)` method that renders it.

## Constructor / validation

- Accept `body_template` (optional) alongside the existing params.
- Add `#parseBodyTemplate(bodyTemplate)`, mirroring `#parseHeaders`: `undefined` → store `undefined` (no template); anything that isn't a plain object or a plain array (i.e. `typeof !== 'object'`, `null`, or fails an "is a plain object/array" check — reuse the same `Array.isArray` split `#parseHeaders` already uses for its own object-vs-array check) → throw `InvalidEmitBodyTemplate(bodyTemplate)`; otherwise store as-is (nested structure is not deep-validated here — malformed tokens simply won't match and are left literal, per the missing-field rule).
- Add `get bodyTemplate()` returning the stored value (`undefined` when not configured).

## resolveBody(item)

- `resolveBody(item)`: when `bodyTemplate` is `undefined`, return `item` unchanged (today's behavior). Otherwise return `this.#renderTemplate(this.#bodyTemplate, item)`.
- `#renderTemplate(node, item)`: recurse by `node`'s type —
  - Array → map each element through `#renderTemplate(el, item)`.
  - Plain object → return a new object with each value passed through `#renderTemplate(value, item)` (keys are never templated, only values).
  - String → apply `#renderString(node, item)`.
  - Anything else (number, boolean, `null`) → return as-is.
- `#renderString(str, item)`:
  - Whole-token case: if `str` matches `/^\{:([.\w]+)\}$/` exactly, resolve the captured path against `item` via `#resolveToken` and return that value verbatim (any type) when found; when not found, return `str` unchanged (the literal token).
  - Otherwise: `str.replace(/\{:([.\w]+)\}/g, (full, path) => { const value = #resolveToken(path, item); return value === undefined ? full : String(value); })`.
- `#resolveToken(path, item)`: `path === '.'` → return `item` itself. Otherwise split on `.` and walk `item` segment by segment (`current?.[segment]`), returning `undefined` as soon as a segment is missing or `current` isn't an indexable object — this is what makes a not-found path resolve to "missing" (literal token / no splice) rather than throwing.

Keep this token regex and resolution logic separate from `resolveUrl`'s own `/\{:(\w+)\}/g` — different input shape (nested item vs. flat `parameters`), do not try to share one implementation between them (see `engine.md` Notes).

## Files to Change

- `source/lib/models/request/ResourceRequestEmit.js` — add `body_template` param, `#bodyTemplate` field, `#parseBodyTemplate`, `bodyTemplate` getter, `resolveBody`, `#renderTemplate`, `#renderString`, `#resolveToken`; import `InvalidEmitBodyTemplate`; update the class JSDoc and constructor `@param` block.

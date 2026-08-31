# Extract TokenResolver

Create `TokenResolver` as a stateless static-method class in `source/lib/models/request/`, owning `ResourceRequestEmit`'s current private `#resolveToken` logic (dot-path resolution against an item):

```js
static resolve(path, item) {
  if (path === '.') return item;
  return path.split('.').reduce((current, segment) => current?.[segment], item);
}
```

This is not yet wired into `ResourceRequestEmit` — that happens in step 03 (via `TemplateStringRenderer`) and step 04. `ResourceRequestEmit`'s own `#resolveToken` stays in place until step 04 removes it, so behavior is unaffected mid-refactor.

Add a dedicated spec explicitly covering the edge cases the issue calls out:
- `.` resolves to the whole item, including non-object items (e.g. a string or number item).
- A single-segment path (`key`) resolves a top-level property.
- A multi-segment path (`nested.path`) resolves through nested objects.
- A missing intermediate segment (e.g. `a.b.c` against `{a: null}`) resolves to `undefined` rather than throwing.
- A resolved value of `null`, `0`, `false`, or `''` is returned as-is (not treated as "unresolved").

## Files to Change

- `source/lib/models/request/TokenResolver.js` — new class, static `resolve(path, item)`.
- `source/spec/lib/models/request/TokenResolver_spec.js` — new spec.

# Extract TemplateStringRenderer

Create `TemplateStringRenderer` as a stateless static-method class in `source/lib/models/request/`, owning `ResourceRequestEmit`'s current private `#renderString` logic, delegating token resolution to `TokenResolver` (step 02):

```js
static render(str, item) {
  const wholeTokenMatch = str.match(/^\{:([.\w]+)\}$/);

  if (wholeTokenMatch) {
    const value = TokenResolver.resolve(wholeTokenMatch[1], item);
    return value === undefined ? str : value;
  }

  return str.replace(/\{:([.\w]+)\}/g, (full, path) => {
    const value = TokenResolver.resolve(path, item);
    return value === undefined ? full : String(value);
  });
}
```

Not yet wired into `ResourceRequestEmit` — that happens in step 04. `ResourceRequestEmit`'s own `#renderString` stays in place until then.

Add a dedicated spec explicitly covering the whole-token vs. partial-token distinction called out in the issue:
- A string that is *only* a `{:key}` token returns the resolved value **verbatim, unstringified** — test with an object/array value, not just a primitive, to prove it isn't coerced.
- The same token embedded inside a longer string gets `String(value)`-coerced (e.g. a resolved number or `null` becomes `"42"` / `"null"` in the output).
- An unresolved token (`value === undefined`) is left as the literal `{:key}` text, both in the whole-token and partial-token cases.
- A resolved value of `null`, `0`, `false`, or `''` is rendered (not treated as unresolved).

## Files to Change

- `source/lib/models/request/TemplateStringRenderer.js` — new class, static `render(str, item)`, imports `TokenResolver`.
- `source/spec/lib/models/request/TemplateStringRenderer_spec.js` — new spec.

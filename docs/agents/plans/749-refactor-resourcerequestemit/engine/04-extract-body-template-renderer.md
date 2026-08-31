# Extract BodyTemplateRenderer and wire resolveBody

Create `BodyTemplateRenderer` as a stateless static-method class in `source/lib/models/request/`, owning `ResourceRequestEmit`'s current private `#renderTemplate` logic (the array/object recursive walk), delegating string-node rendering to `TemplateStringRenderer` (step 03):

```js
static render(node, item) {
  if (Array.isArray(node)) {
    return node.map((element) => BodyTemplateRenderer.render(element, item));
  }

  if (node !== null && typeof node === 'object') {
    return Object.fromEntries(
      Object.entries(node).map(([key, value]) => [key, BodyTemplateRenderer.render(value, item)])
    );
  }

  if (typeof node === 'string') {
    return TemplateStringRenderer.render(node, item);
  }

  return node;
}
```

Then wire `ResourceRequestEmit#resolveBody` to delegate to it, and remove the now-dead private methods and their JSDoc from `ResourceRequestEmit.js` (`#renderTemplate`, `#renderString`, `#resolveToken`):

```js
resolveBody(item) {
  if (this.#bodyTemplate === undefined) return item;
  return BodyTemplateRenderer.render(this.#bodyTemplate, item);
}
```

Preserve the exact non-plain-object-node behavior called out in the issue: a `Date` (or any other object whose `typeof` is `'object'`) falls into the plain-object branch and gets flattened via `Object.entries` (e.g. a `Date` in the template becomes `{}` in the output) — do not special-case or "fix" this.

Add a dedicated spec covering:
- Nested arrays and objects in the template, recursively rendered.
- A non-plain-object node (e.g. a `Date` instance) in the template, confirming it's flattened to `{}` rather than special-cased.
- Scalars (number, boolean, `null`) in the template pass through unchanged.
- Delegation to `TemplateStringRenderer` for string nodes (can be a thin integration-style check rather than re-testing `TemplateStringRenderer`'s own cases).

Run the full existing `ResourceRequestEmit_spec.js` and `ResourceRequest_spec.js` suites (unchanged) to confirm no regression, since both only exercise public methods (`resolveBody`, `resolveUrl`) and never reached into the removed private methods directly.

## Files to Change

- `source/lib/models/request/BodyTemplateRenderer.js` — new class, static `render(node, item)`, imports `TemplateStringRenderer`.
- `source/lib/models/request/ResourceRequestEmit.js` — `resolveBody` delegates to `BodyTemplateRenderer.render`; remove `#renderTemplate`, `#renderString`, `#resolveToken` and their JSDoc; add the `BodyTemplateRenderer` import.
- `source/spec/lib/models/request/BodyTemplateRenderer_spec.js` — new spec.

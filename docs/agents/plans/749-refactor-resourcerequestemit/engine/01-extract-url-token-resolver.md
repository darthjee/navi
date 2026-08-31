# Extract UrlTokenResolver

Create `UrlTokenResolver` as a stateless static-method class in `source/lib/models/request/`, following the `ClientReference.parse(...)` convention. It owns the flat `{:key}`-token replacement currently duplicated verbatim in both `ResourceRequestEmit#resolveUrl` and `ResourceRequest#resolveUrl`:

```js
this.url.replace(/\{:(\w+)\}/g, (_, key) => parameters[key] ?? `{:${key}}`);
```

Expose it as `UrlTokenResolver.resolve(url, parameters)`, returning the resolved URL string. Unmatched tokens (no matching key in `parameters`) must stay literally `{:key}` in the output, exactly as today.

Update both `ResourceRequestEmit#resolveUrl` and `ResourceRequest#resolveUrl` to delegate:

```js
resolveUrl(parameters = {}) {
  return UrlTokenResolver.resolve(this.url, parameters);
}
```

Add a dedicated spec covering: a token with a matching parameter, a token with no matching parameter (left unchanged), multiple tokens in one string, and a URL with no tokens at all (returned unchanged).

## Files to Change

- `source/lib/models/request/UrlTokenResolver.js` — new class, static `resolve(url, parameters)`.
- `source/lib/models/request/ResourceRequestEmit.js` — `resolveUrl` delegates to `UrlTokenResolver.resolve`; add the import.
- `source/lib/models/request/ResourceRequest.js` — same delegation and import.
- `source/spec/lib/models/request/UrlTokenResolver_spec.js` — new spec.

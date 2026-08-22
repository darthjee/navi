# Add test-support helpers

Extend `source/spec/support/utils/AxiosUtils.js` (today only `stubGet`/`stubGetRejection`) with one stub + one rejection helper per new verb, mirroring the existing shape exactly:

```js
static stubPost(status, data = undefined) {
  const response = { status, ...(data !== undefined && { data }) };
  spyOn(axios, 'post').and.returnValue(Promise.resolve(response));
  return response;
}
static stubPostRejection(error) {
  spyOn(axios, 'post').and.returnValue(Promise.reject(error));
}
```

...and the same pair for `put`/`patch` (`stubPut`/`stubPutRejection`, `stubPatch`/`stubPatchRejection`), spying on `axios.put`/`axios.patch` respectively — this depends on Step 02 having `Client`'s new method call `axios.post`/`axios.put`/`axios.patch` directly rather than a single `axios.request`.

Also add, alongside the existing factories in `source/spec/support/factories/`:

- `ResourceRequestEmitFactory.js` — mirrors `ResourceRequestFactory.js`'s shape, building a `ResourceRequestEmit` with sensible defaults (`client`, `method: 'POST'`, `url`, optional `status` override) for use in both `Client` and `EmitJob` specs.
- `EmitJobFactory.js` — mirrors `ResourceRequestJobFactory.js`, building an `EmitJob` with a default `item`, `emit` (via `ResourceRequestEmitFactory`), `parameters`, and `clients` (via the existing `NamespaceMapFactory`/`ClientFactory`).

## Files to Change

- `source/spec/support/utils/AxiosUtils.js` — add `stubPost`/`stubPostRejection`, `stubPut`/`stubPutRejection`, `stubPatch`/`stubPatchRejection`.
- `source/spec/support/factories/ResourceRequestEmitFactory.js` — new file.
- `source/spec/support/factories/EmitJobFactory.js` — new file.

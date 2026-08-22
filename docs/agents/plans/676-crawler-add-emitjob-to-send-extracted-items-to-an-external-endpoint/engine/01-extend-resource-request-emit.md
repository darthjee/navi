# Extend ResourceRequestEmit with status and resolveUrl

`ResourceRequestEmit` (`source/lib/models/request/ResourceRequestEmit.js`) today parses `{ client, method, url }` and validates `method` against `EMIT_METHODS = ['POST', 'PUT', 'PATCH']`. Add:

- An optional `status` constructor param, stored as a plain public property (mirror `ResourceRequest.status`, `ResourceRequest.js:59` — no getter/setter, no validation; `undefined` when the YAML config omits it).
- A `resolveUrl(parameters = {})` method, copied verbatim from `ResourceRequest.resolveUrl` (`ResourceRequest.js:203-205`):
  ```js
  resolveUrl(parameters = {}) {
    return this.url.replace(/\{:(\w+)\}/g, (_, key) => parameters[key] ?? `{:${key}}`);
  }
  ```
  operating on `this.url` (`ResourceRequestEmit`'s own field) so `{:field}` tokens in `emit.url` get substituted from the extracted item's fields.
- Update `ResourceRequestEmit.fromObject(obj)` to pass `status: obj.status` through to the constructor.

No new validation/exception is needed for `status` — it is optional and used as-is by `Client` (Step 02).

## Files to Change

- `source/lib/models/request/ResourceRequestEmit.js` — add `status` field, `resolveUrl` method, update `fromObject`.

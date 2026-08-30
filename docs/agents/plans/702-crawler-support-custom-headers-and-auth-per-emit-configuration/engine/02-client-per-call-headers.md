# Thread per-call headers through Client#emit

Let a single emit call carry extra headers that merge over the client's configured
headers, without changing GET/`perform` behaviour.

## Behaviour

- `Client#emit(method, resourceUrl, body, expectedStatus, logContext, headers = {})` —
  add `headers` as a new **trailing optional** parameter (default `{}`) so the existing
  positional call sites and specs keep compiling unchanged.
- Pass it down to `#emitRequest(method, requestUrl, body, expectedStatus, logContext, headers)`.
- In `#emitRequest`, build request options as:
  ```js
  const options = {
    timeout: this.timeout,
    headers: { ...this.headers, ...headers },
    validateStatus: () => true,
  };
  ```
  Keys present in the per-call `headers` win; every other client header is still sent.
  An empty `headers` object produces exactly today's behaviour.
- Update the JSDoc of both methods with the new `@param {object} [headers={}]` line
  (CI jsdoc is `--pedantic`).
- Do **not** touch `#requestUrl` / `performUrl` / `perform` — GET requests are out of
  scope for this issue.

## Specs

`source/spec/lib/client/Client_spec.js` — in the existing `describe('emit')` block
(around the `client.emit(method, resourceUrl, body, ...)` cases):
- default (no `headers` arg) → axios called with `headers` equal to the client's headers
  (assert via the axios spy's argument, matching however the file already spies on axios).
- `headers` arg given, disjoint keys → axios called with the union of client + per-call.
- `headers` arg given, overlapping key → axios called with the per-call value for that
  key, client value for the others.
- Cover at least one non-`POST` method (`PUT` or `PATCH`) to prove the merge is in the
  shared `#emitRequest` path, not per-branch.

## Files to Change

- `source/lib/client/Client.js` — `emit` + `#emitRequest` signatures, options merge, JSDoc.
- `source/spec/lib/client/Client_spec.js` — per-call header merge cases in the `emit` describe.

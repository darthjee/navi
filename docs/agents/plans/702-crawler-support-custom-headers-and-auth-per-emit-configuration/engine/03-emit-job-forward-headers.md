# Forward emit.headers from EmitJob

Wire the two ends together: `EmitJob` passes its emit's `headers` into the client call.

## Behaviour

- In `EmitJob#perform` (`source/lib/jobs/EmitJob.js`), change the client call to:
  ```js
  const response = await this.#getClient().emit(
    this.#emit.method, url, this.#item, this.#emit.status, logContext, this.#emit.headers,
  );
  ```
- `this.#emit.headers` is always an object (Step 1 guarantees `{}` when unset), so no
  guard is needed.
- No constructor / `arguments` getter changes — `arguments` stays `{ url, method }`
  (headers are not part of the serialized job identity). Note this explicitly in the
  PR description in case a reviewer expects headers in `arguments`.
- `EmitEnqueuer` needs no change — it already forwards the whole `emit` object into the
  job payload.

## Specs

`source/spec/lib/jobs/EmitJob_spec.js`:
- In the successful-emit path, spy on the resolved client's `emit` and assert it is
  called with the emit's `headers` as the 6th argument.
- Add a case where `ResourceRequestEmitFactory.build({ ..., headers: { 'X-Token': 'abc' } })`
  → client `emit` receives `{ 'X-Token': 'abc' }`.
- Add a case with no `headers` configured → client `emit` receives `{}` (or whatever
  Step 1 defines as the empty default) — guards against regressing the default path.
- Reuse the existing `rebuildJob` helper; extend it to accept a `headers` option if that
  keeps the new cases consistent with the file's style.

## Files to Change

- `source/lib/jobs/EmitJob.js` — pass `this.#emit.headers` to `client.emit(...)`.
- `source/spec/lib/jobs/EmitJob_spec.js` — assert header forwarding; extend `rebuildJob` if needed.

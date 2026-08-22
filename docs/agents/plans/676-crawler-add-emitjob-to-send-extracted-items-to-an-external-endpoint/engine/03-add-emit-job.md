# Add EmitJob

New `source/lib/jobs/EmitJob.js`, following `ResourceRequestJob`'s conventions (`source/lib/jobs/ResourceRequestJob.js`):

- Extends `Job` (from `deku-swarm`, same import as `ResourceRequestJob`/`ExtractionJob`).
- Constructor accepts `{ id, item, emit, parameters, clients }`:
  - `item` — the single extracted item (a plain object, one element of a parser's `extract()` output array — see `RegexParser.extract`).
  - `emit` — a `ResourceRequestEmit` instance (`client`, `method`, `url`, optional `status`).
  - `parameters` — optional, passed to `emit.resolveUrl(parameters)` for `{:placeholder}` substitution (mirrors `ResourceRequestJob`'s use of `parameters` for its own `resolveUrl` call).
  - `clients` — the client registry (`NamespaceMap`), same role as `ResourceRequestJob`'s `#clients`.
- Private `#getClient()` resolves the client via `this.#clients.getClient(namespace, clientName, clientNamespace)`, same pattern as `ResourceRequestJob.#getClient()`, using `emit`'s already-parsed `clientName`/`clientNamespace` (via `ClientReference`, see `ResourceRequestEmit.js`).
- `get arguments()` getter — return a plain object useful for logging/serialization, e.g. `{ url: resolvedUrl, method: emit.method }` (mirror `ResourceRequestJob`'s `arguments` getter shape).
- `async perform(logContext)`:
  ```js
  async perform(logContext) {
    logContext.debug(...);
    try {
      this.lastError = undefined;
      const url = this.#emit.resolveUrl(this.#parameters);
      const response = await this.#getClient().emit(this.#emit.method, url, this.#item, this.#emit.status, logContext);
      return response;
    } catch (error) {
      logContext.error(...);
      this._fail(error);
    }
  }
  ```
  (adjust exact `Client` method name/signature to whatever Step 02 lands on). Failure path calls the inherited `_fail(error)` — same as `ResourceRequestJob` — which increments the attempt counter and re-throws, letting the queue's retry mechanism take over.
- Do **not** override `maxRetries` — inherits the base `Job` default of `3` (unlike `ExtractionJob`, which overrides it to `1`). `retry_cooldown` needs no per-job wiring; it is already global via `WorkersConfig`/`JobRegistry.build({ cooldown, maxRetries })` in `ApplicationInstance#initRegistries`.

## Files to Change

- `source/lib/jobs/EmitJob.js` — new file, the `EmitJob` class.

# Define the extracted-item contract and add EmitEnqueuer

Both built-in parsers already agree on a de-facto shape — `JsonPathParser.extract()` and `RegexParser.extract()` both return `Array<{[field]: value}>`, a flat plain object per item — but it isn't written down anywhere as a named contract. Formalize it with a shared JSDoc `@typedef` (e.g. `ExtractedItem`) referenced from both parsers' `extract()` `@returns` and from `EmitJob`'s `item` param, so it reads as one deliberate contract rather than two parsers that happen to agree.

Then add the new fan-out class. Every existing "one job enqueues N follow-up jobs" case in this codebase already delegates to a dedicated Enqueuer class rather than calling `jobRegistry.enqueue(...)` inline (`ActionEnqueuer` for actions, `AssetRequestEnqueuer` for assets) — follow the same convention here rather than looping inline inside `ExtractionJob`.

Add `EmitEnqueuer`, mirroring `ActionEnqueuer`'s shape (constructor takes the list to fan out over, the shared config, and the job registry; `enqueue()` does the `Application.isStopped()` guard and loop):

```js
class EmitEnqueuer {
  constructor(items, emit, parameters, jobRegistry = DefaultJobRegistry) { ... }

  enqueue() {
    if (Application.isStopped()) return;
    for (const item of this.#items) {
      this.#jobRegistry.enqueue('Emit', { item, emit: this.#emit, parameters: this.#parameters });
    }
  }
}
```

Note `clients` is deliberately *not* a constructor param here: `JobFactory.build('Emit', ...)` in `ApplicationInstance.js` already injects `clients: this.config.namespaceMap` as a default attribute for every `Emit` job (the same way `AssetDownload` jobs get `clientRegistry` injected), so only `item`, `emit`, and `parameters` need to travel through the per-item enqueue call.

## Files to Change

- `source/lib/enqueuers/EmitEnqueuer.js` — new class, per above.
- `source/spec/lib/enqueuers/EmitEnqueuer_spec.js` — new spec, mirroring `ActionEnqueuer_spec.js`'s structure (enqueues one `Emit` job per item with the right params; does nothing when `Application.isStopped()`).
- `source/lib/parsers/JsonPathParser.js`, `source/lib/parsers/RegexParser.js` — add/reference the shared `ExtractedItem` JSDoc typedef in each `extract()`'s `@returns`.
- `source/lib/jobs/EmitJob.js` — reference the same typedef for the `item` constructor param's JSDoc.

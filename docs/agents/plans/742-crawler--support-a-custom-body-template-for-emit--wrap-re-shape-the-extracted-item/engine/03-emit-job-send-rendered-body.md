# EmitJob: send the rendered body

`EmitJob#perform` currently sends `this.#item` verbatim as the emit request body. Switch it to send `this.#emit.resolveBody(this.#item)`, which is `this.#item` unchanged when no `body_template` is configured (see engine step 02).

## Files to Change

- `source/lib/jobs/EmitJob.js` — in `#perform`, replace the `this.#item` argument to `this.#getClient().emit(...)` (line ~129) with `this.#emit.resolveBody(this.#item)`. No other change: `EmissionRegistry.recordEmission` and `#itemRef()` keep referencing `this.#item` (the raw item), not the rendered body — emission records should reflect the source item, not its wire shape. Update the `perform` JSDoc if it references "sends the extracted item" wording that's no longer literally accurate.

# Extract shared client-reference parsing helper

`ResourceRequest.#parseClient` (a private static method) already knows how to turn a raw client reference — either a bare name string, or a `{name, namespace}` object — into a `{name, namespace}` pair. `emit.client` needs to accept the exact same two forms. Rather than duplicating this parsing logic inside the new `ResourceRequestEmit` model, extract it into a small, shared, importable helper (e.g. a `parseClientReference(client)` function in a new `source/lib/models/request/ClientReference.js`, or promoted to a non-private static on `ResourceRequest` if that reads more naturally) and have `ResourceRequest` call it instead of its own private copy.

Keep the exact same input/output contract `#parseClient` has today (`{ name, namespace }`, `namespace` defaulting to `null`) so `ResourceRequest`'s existing behavior and specs are unaffected — this step is a pure extraction, no behavior change.

## Files to Change

- `source/lib/models/request/ClientReference.js` — new shared helper exporting the client-reference parsing function (name is a suggestion; pick whatever fits the codebase's conventions for a small shared utility).
- `source/lib/models/request/ResourceRequest.js` — replace the private `#parseClient` body with a call to the shared helper.

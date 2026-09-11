# Integration specs for POST /api/engine/start with parameters

`ApiEngineStartHandler_spec.js` already exercises the handler end-to-end
(`#process()` against a real `NamespaceMap`/`Application`, a mocked `res` and a
spied `JobRegistry.enqueue`) rather than through a separate HTTP/supertest
layer — there is no such harness in this repo. This step adds describe blocks
to that same spec file (alongside the validation cases from step 03) covering
the full request→response contract end to end, using `ResourceFactory` /
`ResourceRequestFactory` to register a real namespace with a token-bearing
resource (e.g. `/bundle/{:slug}/`).

Scenarios to cover:

- A single `targets[]` entry with an object-form resource
  (`{ name: 'collection', parameters: { slug: 'x' } }`) results in
  `JobRegistry.enqueue('ResourceRequestJob', { resourceRequest, parameters: { slug: 'x' } })`
  being called, `enqueued` containing `'collection'`, and the response `status`
  matching today's stopped/running semantics.
- A batch of two entries for the same resource name, one with a satisfying
  `parameters` value and one missing a required token, yields both effects at
  once: one `ResourceRequestJob` enqueue call for the satisfied entry, and a
  `skippedResources` entry for the other with
  `{ name, reason: 'needs_params', parameters: <merged map> }`.
- A target-level `parameters` default merged under one resource's per-resource
  override produces the expected per-key precedence in the enqueued job's
  `parameters` (per-resource wins).
- An existing bare-string-only `targets[]` payload (no `parameters` anywhere)
  produces byte-for-byte the same `enqueued`/`skippedResources` shape as before
  this feature — no `parameters` key appears anywhere in the response.
- A resource with a request that has no `{:token}` at all still enqueues
  normally when a `parameters` map is supplied alongside it (extra keys ignored
  for URL purposes, still present in the enqueued job's `parameters`).

## Files to Change

- `source/spec/lib/server/handlers/api/ApiEngineStartHandler_spec.js` — the
  scenarios above, added alongside (not replacing) the existing validation and
  state-transition describe blocks from step 03.

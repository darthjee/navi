# Refactor ExtractionJob_spec.js
`ExtractionJob_spec.js` (14 clones) repeats `new ExtractionJob({ id: 'test-id', rawBody, parser, parserRegistry, ... })` in almost every `beforeEach`/`it`, redeclares `emit = new ResourceRequestEmit(...)` + `parameters` in three places, and repeats `parserImpl.extract.and.returnValue(items); await job.perform(logContext);`.

- Replace inline constructions with `ExtractionJobFactory.build({...})` (step 01), overriding only `emit`, `parameters`, `originUrl`, `jobRegistry` or `parser` where the scenario needs it.
- Hoist the shared `emit`/`parameters`/`originUrl` fixtures (via `ResourceRequestEmitFactory` or a single file-level const) and the repeated item lists (`[{ price: '42.50' }, { price: '10.00' }]`) into constants.
- Add a local `performWith(items)` helper that stubs `parserImpl.extract` and performs the job, used across "#perform", "emission tracking" and "extraction tracking".
- Parameterise the `Emit` enqueue-payload expectations (`'Emit', { item, emit, parameters, extractionId }`) and the two "is exhausted after one failure" scenarios where they only differ by how the failure is triggered.
- Do not drop any scenario (registry built / not built, emit present / absent, ParserNotFound, parser throws).

## Files to Change
- `source/spec/lib/jobs/ExtractionJob_spec.js` — dedupe as above

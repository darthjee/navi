# Move the paginated suite to PaginatedExtractionEmitFlow_spec.js

Create `source/spec/lib/jobs/PaginatedExtractionEmitFlow_spec.js` holding the `paginated_actions + parser/emit interaction (end-to-end)` suite (current lines 235–422) with its JSDoc comment, verbatim in behavior:

- Use `EndToEndFlowUtils.setup()` for logger/logContext/JobRegistry lifecycle; keep `AxiosUtils.stubPost(200, {})` and `NamespaceMap.reset()` in the suite's own hooks.
- Use `EndToEndFlowUtils.buildParserRegistry()` and `EndToEndFlowUtils.exampleClients()` inside `buildNamespaceMap` / `registerJobFactories`.
- Replace the local `enqueued` / `performAll` / `expectEmitted` calls with the util's.
- Keep Scenario A and Scenario B (and their page-varying `axios.get` fakes) unchanged.
- Import only what this file needs.

## Files to Change
- `source/spec/lib/jobs/PaginatedExtractionEmitFlow_spec.js` — new file

# Slim down ExtractionEmitFlow_spec.js

In `source/spec/lib/jobs/ExtractionEmitFlow_spec.js`:

- Remove the paginated suite (moved in step 02) and the module-level helpers (`enqueued`, `hasEnqueued`, `performAll`, `expectEmitted`).
- Use `EndToEndFlowUtils.setup()` for the common lifecycle, and `EndToEndFlowUtils.buildParserRegistry()` / `exampleClients()` in the remaining `beforeEach` that registers the `Action` / `Extraction` / `Emit` job factories.
- Keep `postIdBody`, `postIdRequestAttributes`, `buildTopJob`, `performTopAndFindExtraction`, `performExtractionAndFindEmits` local (only this suite uses them), switched to the util's helpers.
- Drop imports no longer used (`PaginatedActionProcessingJob`, `Namespace`, `NamespaceMap`, `ResourceFactory`, parser classes, ...).
- Run `yarn spec` and `yarn lint` in `source/`, and confirm both spec files are under 300 lines.

## Files to Change
- `source/spec/lib/jobs/ExtractionEmitFlow_spec.js` — keep suite 1 only, use the util

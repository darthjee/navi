# Add EndToEndFlowUtils support util

Create `source/spec/support/utils/EndToEndFlowUtils.js`, a static-method class in the style of `JobRegistryUtils` / `EmitJobSpecUtils` (JSDoc on every method, named export `export { EndToEndFlowUtils };`). It should provide:

- `enqueued(klass)` — `JobRegistry.jobsByStatus('enqueued')` filtered by `instanceof klass`.
- `hasEnqueued(klass)` — `enqueued(klass).length > 0`.
- `performAll(jobs, logContext)` — performs each job sequentially (`for ... of` + `await`).
- `expectEmitted(url, body)` — `expect(axios.post).toHaveBeenCalledWith(url, body, jasmine.anything())`.
- `buildParserRegistry()` — `new ParserRegistry({ json_path: new JsonPathParser(), regex: new RegexParser() })`.
- `exampleClients()` — the `{ lootstudios, majora_api }` `ClientFactory` map (`https://app.lootstudios.com`, `https://majora.example.com`), usable both inside `NamespaceMapFactory.build({ clients })` and a real `Namespace`.
- `setup()` — installs the common `beforeEach` (stub logger methods, create the `logContext` spy object with `debug/info/warn/error`, `JobRegistry.build({ cooldown: -1 })`) and `afterEach` (`JobRegistry.reset()`, `JobFactory.reset()`), returning a ctx object exposing `logContext`. Suite-specific setup (job factory registration, `NamespaceMap.reset()`, axios stubs) stays in each spec.

## Files to Change
- `source/spec/support/utils/EndToEndFlowUtils.js` — new file

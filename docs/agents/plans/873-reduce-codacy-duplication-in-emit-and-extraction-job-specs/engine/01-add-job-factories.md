# Add ExtractionJob and HtmlParseJob factories
Neither `ExtractionJob` nor `HtmlParseJob` has a spec factory, so their specs call the constructor inline (`new ExtractionJob({ id: 'test-id', rawBody, parser, parserRegistry, ... })`) in almost every test. Add factories in the style of `EmitJobFactory` / `AssetRequestFactory` (static `build({...} = {})` with JSDoc and sensible defaults) so specs override only what matters for the scenario.

- `ExtractionJobFactory.build({ id = 'test-id', rawBody, parser, parserRegistry, jobRegistry, emit, parameters, originUrl })` — defaults for the required collaborators should be inert dummies (e.g. `rawBody` a plain string, `parser` a regex `ResourceRequestParser`, `parserRegistry`/`jobRegistry` spy objects) so `EmitJob`-style "just build a job" callers work; `emit`, `parameters`, `originUrl` stay `undefined`/`null` by default to match the constructor defaults.
- `HtmlParseJobFactory.build({ id = 'test-id', rawHtml, assetRequests = [], jobRegistry, clientRegistry, originUrl })` — defaults `clientRegistry` to `NamespaceMapFactory.build()` and `jobRegistry` to a `jasmine.createSpyObj('jobRegistry', ['enqueue'])`.

Steps 03 and 04 consume these; the existing specs must not change behaviour when switching to them (specs that assert on `jobRegistry.enqueue` must still be able to pass their own spy in).

## Files to Change
- `source/spec/support/factories/ExtractionJobFactory.js` — new factory
- `source/spec/support/factories/HtmlParseJobFactory.js` — new factory

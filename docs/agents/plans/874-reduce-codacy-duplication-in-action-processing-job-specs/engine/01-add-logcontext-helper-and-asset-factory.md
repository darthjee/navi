# Add logContext helper and AssetDownloadJobFactory

Create the two small support files the later steps depend on.

- A helper that returns the `logContext` spy object (`debug`, `info`, `warn`, `error`) so specs stop repeating `jasmine.createSpyObj('logContext', [...])`. Use it in the four job specs of this issue; leave other specs' usages alone unless trivially adjacent.
- `AssetDownloadJobFactory`, following the shape and JSDoc style of `ResourceRequestJobFactory`/`ExtractionJobFactory`. It builds an `AssetDownloadJob` with defaults `id = 'asset-job'`, `url = 'https://cdn.example.com/app.css'`, `status = 200`, and a `clientRegistry` defaulting to `NamespaceMapFactory.build({ clients: { default: ClientFactory.build({ baseUrl: 'https://example.com' }) } })`, plus an optional `client` name.

## Files to Change
- `source/spec/support/utils/LogContextUtils.js` — new helper exposing e.g. `LogContextUtils.build()` that returns the spy object
- `source/spec/support/factories/AssetDownloadJobFactory.js` — new factory with JSDoc

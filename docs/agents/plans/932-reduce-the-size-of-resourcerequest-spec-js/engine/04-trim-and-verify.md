# Trim ResourceRequest_spec.js and verify
Remove the moved blocks (lines 236–697) and the local `buildResponseWrapper`/`setupJobRegistrySpy` helpers from `ResourceRequest_spec.js`, keeping `.fromList`, `#parser and #emit` and the accessors. Drop now-unused imports (`JobRegistry`, `ResponseWrapper`, `Application`, `AssetRequestFactory`, `ClientRegistryFactory`, `ResourceRequestActionFactory`, `RegistryCleanupUtils`). Keep `AssetRequest`, `ResourceRequestEmit`, `ResourceRequestParser` and `ResourceRequestFactory` (used by `.fromList`, `#parser and #emit` and the accessors), and keep `LogRegistry` and `LoggerUtils` (used by `#maxPage`).

Then verify, in `source/`:
- `wc -l` on all four spec files — each under 300.
- Total `it(` count equals the original file's.
- `yarn spec` and `yarn lint` pass.

## Files to Change
- `source/spec/lib/models/request/resource_request/ResourceRequest_spec.js` — keep only construction and accessor specs

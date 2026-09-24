# Create ResourceRequest_enqueue_spec.js and ResourceRequest_extraction_spec.js
Move the enqueue-related blocks into two new files, each wrapped in `describe('ResourceRequest', ...)`:

- `ResourceRequest_enqueue_spec.js`: `#enqueueActions`, `#hasAssets`, `#enqueueAssets`, `#hasParser`, `#hasEmit` (lines 407–576).
- `ResourceRequest_extraction_spec.js`: `#enqueueExtraction`, `#enqueuePaginatedActions` (lines 578–697).

In `#enqueueActions` and `#enqueuePaginatedActions`, replace the local `setupJobRegistrySpy()` + `afterEach(RegistryCleanupUtils.resetJobRegistry)` pair with a call to `ResourceRequestSpecUtils.setupJobRegistrySpy()` at the top of the describe, and replace `buildResponseWrapper(...)` with `ResourceRequestSpecUtils.buildResponseWrapper(...)`. Keep all other setup (`#enqueueAssets`/`#enqueueExtraction` use their own `jasmine.createSpyObj('jobRegistry', ...)` and `LoggerUtils.stubLoggerMethods()`) unchanged.

Import only what each file uses (`JobRegistry` from `deku-swarm`, `ResourceRequest`, `Application`, `AssetRequestFactory`, `ClientRegistryFactory`, `ResourceRequestActionFactory`, `ResourceRequestFactory`, `LoggerUtils`, `ResourceRequestSpecUtils`).

## Files to Change
- `source/spec/lib/models/request/resource_request/ResourceRequest_enqueue_spec.js` — new spec with actions/assets enqueueing and the `#has*` predicates
- `source/spec/lib/models/request/resource_request/ResourceRequest_extraction_spec.js` — new spec with extraction and paginated-action enqueueing

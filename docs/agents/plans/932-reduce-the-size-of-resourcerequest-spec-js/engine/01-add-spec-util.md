# Add the shared ResourceRequest spec util
Create `ResourceRequestSpecUtils` in `source/spec/support/utils/`, modelled on `ActionEnqueuerUtils` (JSDoc on the class and every method, named export):

- `static buildResponseWrapper(data)` — returns `new ResponseWrapper({ data, headers: {} })` (moved from the spec's local helper).
- `static setupJobRegistrySpy()` — installs a `beforeEach` that runs `LoggerUtils.stubLoggerMethods()`, `JobRegistry.build({ cooldown: -1 })` and `spyOn(JobRegistry, 'enqueue').and.stub()`, and an `afterEach` that runs `RegistryCleanupUtils.resetJobRegistry()`. This replaces the duplicated beforeEach/afterEach pair in `#enqueueActions` and `#enqueuePaginatedActions`. Blocks keep their own `beforeEach` for block-specific setup (building `action`, `request`, `paginatedAction`); Jasmine runs the util's `beforeEach` first because it is registered first.

## Files to Change
- `source/spec/support/utils/ResourceRequestSpecUtils.js` — new util with `buildResponseWrapper` and `setupJobRegistrySpy`

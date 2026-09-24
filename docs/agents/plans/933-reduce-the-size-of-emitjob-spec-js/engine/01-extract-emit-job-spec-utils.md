# Extract EmitJobSpecUtils

Create `source/spec/support/utils/EmitJobSpecUtils.js` (JSDoc-documented class with static methods, in the style of `ResourceRequestSpecUtils`/`JobRegistryUtils`) holding everything the three spec files share:

- **Constants**: `baseUrl`, `url`, `fullUrl`, `item`, `expectedRequestOptions` (static getters or exported constants).
- **`setup()`**: installs the common `beforeEach` (`LoggerUtils.stubLoggerMethods()`, `logContext` spy object, `ClientFactory.build({ baseUrl })`, `NamespaceMapFactory.build({ clients: { default: client } })`, initial `rebuildJob()`) and returns a mutable context object (`ctx`) whose fields (`client`, `clients`, `logContext`, `emit`, `parameters`, `job`, `response`) are refreshed on each `beforeEach`. Specs read `ctx.job`, `ctx.client`, etc. instead of closure variables.
- **`rebuildJob(ctx, options)`** (or `ctx.rebuildJob(options)`): same option set and defaults as today (`emitUrl`, `method`, `status`, `jobItem`, `jobParameters`, `headers`, `bodyTemplate`, `retries`, `cooldown`, `emitClient`, `extractionId`), building via `ResourceRequestEmitFactory` + `EmitJobFactory`.
- **`performIgnoringFailure(ctx, times = 1)`**.
- **`firstRecord()`**: `EmissionRegistry.getRecords()[0]`.
- **`itForwardsToClientEmit(ctx, { description, title, jobOptions, expectedBody, expectedHeaders })`**: the shared example currently local to the spec.

Keep the util free of spec-specific assertions other than `itForwardsToClientEmit`.

## Files to Change
- `source/spec/support/utils/EmitJobSpecUtils.js` — new shared util (constants, setup, rebuildJob, performIgnoringFailure, firstRecord, itForwardsToClientEmit).

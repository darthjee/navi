# Plan: Reduce the size of ResourceRequestJob_spec.js

Issue: [941-reduce-the-size-of-resourcerequestjob-spec-js.md](../../issues/941-reduce-the-size-of-resourcerequestjob-spec-js.md)

## Overview
Split `source/spec/lib/jobs/ResourceRequestJob_spec.js` into two spec files and extract the setup they share into a support util, so each file is well under 300 lines and every existing assertion is kept.

## Context
The spec size check reports `ResourceRequestJob_spec.js` as WARN (313 lines). `#perform` (lines 86–312) covers success, failure, parameterized URL resolution, assets, parser/no-parser and namespace-aware client resolution. Several contexts repeat the same `rebuildJob()` + `spyOn(...)` + `stubEnqueueMethods()` + `AxiosUtils.stubGet(...)` setup. The top-level `beforeEach`, the `rebuildJob` / `stubEnqueueMethods` / `performAndExpectResponse` helpers and the constants (`baseUrl`, `url`, `fullUrl`, `status`, `expectedRequestOptions`) are needed by both halves once the file is split.

Previous issues (#935–#940) handled the same kind of spec in the same way: a `<Subject>SpecUtils` class in `source/spec/support/utils/` with a `setup()` that registers `beforeEach` hooks and returns a context object that is refilled each time. See `ApiEngineStartHandlerSpecUtils.js`.

## Implementation Steps

### Step 1 — Extract `ResourceRequestJobSpecUtils`
Create `source/spec/support/utils/ResourceRequestJobSpecUtils.js`, following the style of `ApiEngineStartHandlerSpecUtils` (JSDoc on every method, static class, named export). It should expose:

- The shared constants: `baseUrl`, `url`, `fullUrl`, `status`, and `expectedRequestOptions`. Build `expectedRequestOptions` lazily (for example with a static getter or method) because `jasmine.any` is only available at spec runtime.
- `setup()`, which registers a `beforeEach` that stubs logger methods (`LoggerUtils.stubLoggerMethods()`), builds `logContext` (`LogContextUtils.build()`), builds the default `client`/`clients` (`ClientFactory` + `NamespaceMapFactory`) and calls `rebuildJob()`. It returns a context object `ctx` holding `resourceRequest`, `clients`, `client`, `parameters`, `job`, `logContext` and `response`, plus bound helpers:
  - `ctx.rebuildJob({ requestUrl, jobParameters, resourceRequestAttributes })`, which rebuilds `resourceRequest` / `parameters` / `job` on `ctx`. Extra `resourceRequestAttributes` (e.g. `clientName`, `namespace`) let the namespace context reuse it instead of building the job by hand.
  - `ctx.stubEnqueueMethods()`, which stubs `enqueueActions` / `enqueuePaginatedActions`.
  - `ctx.stubGet(body = '[]')`, which sets `ctx.response = AxiosUtils.stubGet(200, body)`, and optionally a status variant for the 502 case.
  - `ctx.performAndExpectResponse()`.
- Optionally, a helper for the "hook" contexts, e.g. `ctx.prepareHook(predicate, returnValue, enqueueMethod, body)`. It would rebuild the job, spy `predicate` (`hasAssets`/`hasParser`) to return `returnValue`, stub `enqueueMethod`, stub the enqueue methods and stub the GET. Add it only if it makes the assets/parser/no-parser contexts shorter and still readable.

Specs must read `ctx.*` lazily inside `it` / `beforeEach` blocks, because the object is refilled on every `beforeEach`.

### Step 2 — Split the spec and use the util
- **`source/spec/lib/jobs/ResourceRequestJob_spec.js`** keeps `#constructor`, `#arguments`, and in `#perform`: "when the client request is successful", "when the client request fails", and the parameterized-URL `forEach` cases. Replace the local helpers, constants and top-level `beforeEach` with `ResourceRequestJobSpecUtils.setup()` / `ctx`.
- **`source/spec/lib/jobs/ResourceRequestJobEnqueue_spec.js`** (new, `describe('ResourceRequestJob', ...)` → `describe('#perform', ...)`) gets "when the resource request has assets", "when the resource request has a parser", "when the resource request has no parser" and "namespace-aware client resolution", all using the same util.
- Keep every `it` description and assertion as they are, only swapping local variables for `ctx.*`. Drop imports that become unused in each file.
- Run `yarn spec` and `yarn lint` in `source/` and check that both files are under 300 lines. The spec count must match the pre-split total (confirm by running jasmine on the original file first and then on the two new files).

## Files to Change
- `source/spec/support/utils/ResourceRequestJobSpecUtils.js` — new shared setup/constants/helpers for ResourceRequestJob specs.
- `source/spec/lib/jobs/ResourceRequestJob_spec.js` — trimmed to constructor/arguments/success/failure/URL resolution, using the util.
- `source/spec/lib/jobs/ResourceRequestJobEnqueue_spec.js` — new; assets, parser, no-parser and namespace-aware client resolution contexts.

## CI Checks
- `source`: `yarn spec` (CI job: `jasmine`)
- `source`: `yarn lint` (CI job: `checks`)

## Notes
- No production code changes; `source/lib/jobs/ResourceRequestJob.js` is untouched.
- The file names and the split point are suggestions. If extracting the util alone gets the file comfortably under 300 lines and keeps it readable, not splitting is also acceptable, as the issue allows.
- `ResourceRequestJobFactory` could be extended instead of adding a util, but it has no access to jasmine spies or hooks, so a `SpecUtils` class fits the existing conventions better.

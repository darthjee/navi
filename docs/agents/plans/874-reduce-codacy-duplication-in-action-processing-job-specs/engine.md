# Engine Plan: Reduce Codacy duplication in action-processing job specs

Main plan: [plan.md](plan.md)

## Overview
All work is under `source/spec/` (engine scope). Two shared "example" functions register common `describe` blocks; two small support files remove repeated setup. Every existing assertion must survive, and no file under `source/lib/` changes.

## Context
- `ActionProcessingJob_spec.js` and `PaginatedActionProcessingJob_spec.js` are line-for-line twins. They differ only in the job class, the action spy name (`action` vs `paginatedAction`, which is also the constructor key), the arguments (`{ item }` vs `{ responseWrapper, parameters }`), the `execute` call arguments and the description/error wording.
- `AssetDownloadJob_spec.js` and `ResourceRequestJob_spec.js` repeat `LoggerUtils.stubLoggerMethods()`, the `logContext` spy object (13 occurrences of `createSpyObj('logContext', ...)` across `source/spec`) and the client/clientRegistry setup. They also repeat lifecycle assertions: stores id, clears `lastError`, not exhausted after success, exhausted after failures.
- `source/spec/support/utils/` hosts shared spec helpers (`JobRegistryUtils`, `JobRegistryScenarios`, `LoggerUtils`); `source/spec/support/factories/` hosts job builders (`ResourceRequestJobFactory`, and `ExtractionJobFactory`/`HtmlParseJobFactory` from #873).
- The test script is `npx jasmine spec/**/*.js`, so support files are loaded as modules but only register specs when their exported function is called.

## Steps

- [01 — Add logContext helper and AssetDownloadJobFactory](engine/01-add-logcontext-helper-and-asset-factory.md)
- [02 — Add shared job lifecycle example](engine/02-add-shared-job-lifecycle-example.md)
- [03 — Add shared action-job example and refactor the twin specs](engine/03-refactor-action-processing-job-specs.md)
- [04 — Refactor AssetDownloadJob and ResourceRequestJob specs](engine/04-refactor-asset-and-resource-request-job-specs.md)

## CI Checks
- `source`: `cd source && npx jasmine 'spec/**/*.js'` (CI job: `jasmine`)
- `source`: `cd source && npm run lint` (CI job: `checks`)
- `source`: `cd source && npm run report` runs `jscpd` locally to compare duplication before and after

## Notes
- Do not change `source/lib/`; if a spec cannot be expressed through the shared example without changing behaviour, keep that scenario inline in the spec.
- Keep failure messages readable: the shared examples must take a description prefix (or nest under the caller's `describe`) so a failing spec still reads like `ActionProcessingJob #perform when the action throws ...`.
- Scenarios that are specific to one job (e.g. `AssetDownloadJob` client fallback, `ResourceRequestJob` assets/parser/enqueue behaviour) stay in their own spec files.
- Codacy's figures only refresh after merge, so verify locally by the jscpd report and confirm the spec count is unchanged (same number of `it`s executed before and after; at minimum no scenario removed).

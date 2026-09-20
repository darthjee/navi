# Add shared action-job example and refactor the twin specs

Add a shared example that registers the constructor/`#maxRetries`/`#arguments` (with and without `originUrl`)/`#perform` (success and throw)/`#exhausted` blocks for an action-based job. Parameterize it by job class, the constructor key of the action (`action` / `paginatedAction`), the action spy name used in descriptions, the base constructor attributes, the expected `arguments`, and the expected `execute` call arguments. Reuse the lifecycle example from step 02 for the id / `Job` / `lastError` / exhaustion scenarios rather than duplicating them.

Then rewrite `ActionProcessingJob_spec.js` and `PaginatedActionProcessingJob_spec.js` as thin specs that only declare their data (spy, item or responseWrapper/parameters, expected arguments) and call the shared example. All existing scenarios and expectations (including `toHaveBeenCalledOnceWith(item)` vs `(responseWrapper, parameters)`) must remain covered.

## Files to Change
- `source/spec/support/utils/ActionJobExamples.js` — new shared-example function
- `source/spec/lib/jobs/ActionProcessingJob_spec.js` — rewrite to use the shared example
- `source/spec/lib/jobs/PaginatedActionProcessingJob_spec.js` — rewrite to use the shared example

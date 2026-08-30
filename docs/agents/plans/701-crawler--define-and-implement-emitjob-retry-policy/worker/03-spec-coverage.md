# Spec coverage for the new behavior

Cover both the additive `Job` constructor behavior and the corrected `JobRegistryInstance.fail()` semantics, and confirm the existing "no retry rights" job types (in `engine`) actually get their intended behavior now that `fail()` respects per-job overrides.

- `Job`: default (`maxRetries` 3, `cooldown` undefined) preserved when the new params are omitted; explicit `maxRetries`/`cooldown` passed at construction are reflected by the getters; a subclass's own `get maxRetries()` override still wins over a constructor-passed value.
- `JobRegistryInstance#fail()`: a job with its own `maxRetries` dead-letters at that count rather than the registry's configured global; a job with its own `cooldown` gets that cooldown applied via `applyCooldown`; a job with neither falls back to the registry's configured global (regression coverage for existing behavior).

## Files to Change

- `worker/spec/background/Job_spec.js` — add cases for the new constructor params, keep existing default-3 cases green.
- `worker/spec/background/JobRegistry_spec.js` (or wherever `JobRegistryInstance.fail()` is exercised through the public `JobRegistry` facade) — add the per-job-override and fallback cases above.

# Issue: Reduce Codacy duplication in action-processing job specs

## Description
Codacy reports 18% code duplication for the repository (the project goal is 10%). This issue tackles the action-processing job specs, two of which are structural twins.

Figures below come from Codacy's analysis of `main` at `f25bf98`.

## Problem
| File | Lines | Clones | Duplicated lines |
| --- | ---: | ---: | ---: |
| `source/spec/lib/jobs/ActionProcessingJob_spec.js` | 88 | 12 | 138 |
| `source/spec/lib/jobs/PaginatedActionProcessingJob_spec.js` | 90 | 12 | 138 |
| `source/spec/lib/jobs/ResourceRequestJob_spec.js` | 252 | 8 | 84 |
| `source/spec/lib/jobs/AssetDownloadJob_spec.js` | 110 | 4 | 30 |

- `ActionProcessingJob_spec.js` and `PaginatedActionProcessingJob_spec.js` have the same describe/`beforeEach`/`#arguments`/origin-URL scenarios and differ only in the job class, the action spy name (`action` vs `paginatedAction`) and the arguments (`{ item }` vs `{ responseWrapper, parameters }`); each has 138 duplicated lines out of ~89
- `AssetDownloadJob_spec.js` and `ResourceRequestJob_spec.js` repeat the same job setup (`LoggerUtils.stubLoggerMethods()`, `logContext` spy object, `ClientFactory`/`NamespaceMapFactory` client registry) and the same lifecycle assertions as the twin specs (stores id, is a `Job`, clears `lastError` before performing, does not exhaust after success, exhausted after failures)

## Expected Behavior
Codacy reports markedly fewer duplication clones for the files above, and behaviour is unchanged (the affected specs still pass and still verify the same scenarios).

## Solution
- Introduce a shared example (a function that registers the common `describe` blocks for an action-based job, given a job factory, the action spy name and the expected arguments) and use it from both `ActionProcessingJob_spec.js` and `PaginatedActionProcessingJob_spec.js`
- Also extract a smaller shared **job lifecycle** example (stores id, is a `Job`, clears `lastError` before performing, does not exhaust after a successful attempt, exhausted after failed attempts) and reuse it from `AssetDownloadJob_spec.js` and `ResourceRequestJob_spec.js` as well as the twin specs
- Extract the common job setup for the resource/asset job specs: add an `AssetDownloadJobFactory` in `source/spec/support/factories/` (as #873 did for `ExtractionJobFactory`/`HtmlParseJobFactory`; `ResourceRequestJobFactory` already exists) and a small helper in `source/spec/support/utils/` that builds the `logContext` spy object used by all the job specs
- Placement convention: shared-example functions and helpers go in `source/spec/support/utils/` (which already hosts `JobRegistryUtils`, `JobRegistryScenarios`, `LoggerUtils`); job builders go in `source/spec/support/factories/`
- Keep every existing assertion and scenario: the refactor must not reduce what the specs verify or change any production code
- Prefer readability over maximal de-duplication; do not introduce abstractions that make a failing spec harder to read
- Owning agent: `engine` (all changes are under `source/`)

## Benefits
- Lowers the repository duplication percentage reported by Codacy
- Makes the affected files shorter and easier to extend, so new scenarios need one line instead of a copied block

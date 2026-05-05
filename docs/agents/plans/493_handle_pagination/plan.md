# Plan: Handle Pagination

## Overview

Add support for `paginated_actions` in Navi's YAML configuration, allowing a resource to fan out into multiple page-specific requests based on a dynamic expression evaluated from the response (e.g. a `pages` header or body field).

## Context

Currently `ResourceRequest` supports `actions` — each action enqueues one `ResourceRequestJob` per chained resource. There is no mechanism to iterate over pages. This plan introduces parallel pagination infrastructure following the same patterns as the existing action pipeline.

## Modules Involved

- `source/lib/models/` — new models + `ResourceRequest` extension
- `source/lib/jobs/` — new job
- `source/lib/enqueuers/` — new enqueuers
- `source/spec/lib/` — test files mirroring each of the above

## Plan Files

- [Models](plan_models.md) — `PaginationConfig`, `ResourceRequestPaginatedAction`, `ResourceRequest` changes
- [Jobs](plan_jobs.md) — `PaginatedActionProcessingJob`
- [Enqueuers](plan_enqueuers.md) — `PaginatedActionEnqueuer`, `PaginatedActionsEnqueuer`
- [Specs](plan_specs.md) — test scenarios for all new classes

## Implementation Order

1. `PaginationConfig` (model, no dependencies on new code)
2. `ResourceRequestPaginatedAction` (model, depends on `PaginationConfig`)
3. `PaginatedActionProcessingJob` (job, depends on `ResourceRequestPaginatedAction`)
4. `PaginatedActionEnqueuer` (enqueuer, depends on job)
5. `PaginatedActionsEnqueuer` (enqueuer, depends on `PaginatedActionEnqueuer`)
6. Extend `ResourceRequest` (depends on `PaginatedActionsEnqueuer`)
7. Register `'PaginatedAction'` factory key in bootstrap

## Notes

- Existing `actions` behaviour is unchanged; `paginated_actions` is purely additive.
- `zero_indexed: false` (1-based) is the default when the flag is absent.
- The `pages` expression reuses `PathResolver` — no new expression evaluator needed.
- Page parameters are merged with the pre-existing parameters already carried by the originating resource request item.

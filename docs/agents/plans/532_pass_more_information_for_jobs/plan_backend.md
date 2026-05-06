# Plan: Pass More Information for Jobs — Backend

## Overview

Add an `originUrl` field to downstream job classes, thread it through the enqueuers, and expose it via the job serializer and API handlers.

## Implementation Steps

### Step 1 — Add `originUrl` to downstream job classes

Update the constructors of `HtmlParseJob`, `ActionProcessingJob`, and `PaginatedActionProcessingJob` to accept and store an `originUrl` parameter.

- The field should default to `null` so existing call sites that do not pass it continue to work during the transition.
- Expose `originUrl` as a public getter so the serializer can read it.

Files:
- `source/lib/jobs/HtmlParseJob.js`
- `source/lib/jobs/ActionProcessingJob.js`
- `source/lib/jobs/PaginatedActionProcessingJob.js`

### Step 2 — Thread `originUrl` through the enqueuers

When `ResourceRequestJob` processes a response and enqueues downstream jobs, it does so via the enqueuers. Update those enqueuers to receive and forward the originating URL.

- `ActionsEnqueuer` / `ActionEnqueuer` — receive `originUrl` and pass it to each `ActionProcessingJob` constructor.
- `PaginatedActionsEnqueuer` / `PaginatedActionEnqueuer` — receive `originUrl` and pass it to each `PaginatedActionProcessingJob` constructor.
- `HtmlParseJob` is likely enqueued directly inside `ResourceRequestJob` — pass `originUrl` (the URL of the `ResourceRequestJob` itself) there as well.

Files:
- `source/lib/enqueuers/ActionsEnqueuer.js`
- `source/lib/enqueuers/ActionEnqueuer.js`
- `source/lib/enqueuers/PaginatedActionsEnqueuer.js`
- `source/lib/enqueuers/PaginatedActionEnqueuer.js`
- `source/lib/jobs/ResourceRequestJob.js` (call-site update)

### Step 3 — Update the job serializer

Locate the serializer responsible for converting job instances to API responses (likely in `source/lib/server/` or `source/lib/background/`). Add the `originUrl` field to the output so it appears in:

- `GET /api/jobs` — jobs listing
- `GET /api/jobs/:id` — show-job detail

Files:
- Job serializer (exact path to be confirmed by codebase inspection)

### Step 4 — Tests

Add or update specs for each changed class, following the `source/spec/lib/` mirror structure:

- `source/spec/lib/jobs/HtmlParseJob_spec.js`
- `source/spec/lib/jobs/ActionProcessingJob_spec.js`
- `source/spec/lib/jobs/PaginatedActionProcessingJob_spec.js`
- `source/spec/lib/enqueuers/ActionsEnqueuer_spec.js`
- `source/spec/lib/enqueuers/PaginatedActionsEnqueuer_spec.js`
- `source/spec/lib/jobs/ResourceRequestJob_spec.js`
- Serializer spec (exact path to be confirmed)

## Files to Change

- `source/lib/jobs/HtmlParseJob.js` — add `originUrl` constructor param and getter
- `source/lib/jobs/ActionProcessingJob.js` — add `originUrl` constructor param and getter
- `source/lib/jobs/PaginatedActionProcessingJob.js` — add `originUrl` constructor param and getter
- `source/lib/enqueuers/ActionsEnqueuer.js` — forward `originUrl`
- `source/lib/enqueuers/ActionEnqueuer.js` — forward `originUrl`
- `source/lib/enqueuers/PaginatedActionsEnqueuer.js` — forward `originUrl`
- `source/lib/enqueuers/PaginatedActionEnqueuer.js` — forward `originUrl`
- `source/lib/jobs/ResourceRequestJob.js` — pass its own URL when enqueuing downstream jobs
- Job serializer — add `originUrl` to API output

## Notes

- The serializer path needs to be confirmed; check `source/lib/server/handlers/jobs/` and any `Serializer` classes referenced there.
- `ResourceRequestJob` is the root — it does not need an `originUrl` of its own; it provides the URL to its children.

# Issue: Queue a new ActionProcessingJob for each Action during ResourceRequest processing

## Description

Currently, when a `ResourceRequestJob` processes a `ResourceRequest`, it also executes all
associated `Action`s directly within the same job. Instead, a dedicated job class should be
introduced to handle each `Action` independently. When processing a `ResourceRequest`, the
system should enqueue one `ActionProcessingJob` per associated `Action` rather than running
them inline.

## Problem

- `ResourceRequestJob` handles both HTTP request execution and action processing, mixing two
  distinct responsibilities in a single class.
- Actions cannot be retried independently from the resource request.
- Actions are processed sequentially and synchronously within a single job, limiting scalability.

## Expected Behavior

- A new job class (e.g. `ActionProcessingJob`) is responsible for processing a single `Action`.
- `ResourceRequestJob`, after completing the HTTP request, enqueues one `ActionProcessingJob`
  per action associated with the resource request, instead of executing them directly.
- The new jobs integrate seamlessly with the existing job queue and worker pool.

## Solution

- Create `ActionProcessingJob` — a new job class responsible for processing a single `Action`.
- Modify `ResourceRequestJob` so that, after receiving a successful response, it enqueues an
  `ActionProcessingJob` for each action instead of invoking them directly.
- Ensure the queuing mechanism works with the current `JobRegistry` and processing flow.
- Update tests and documentation as needed.

## Benefits

- Decouples `ResourceRequest` processing from `Action` processing.
- Improves scalability — actions can be processed in parallel or retried independently.
- Keeps code organized with clear separation of responsibilities.

---
See issue for details: https://github.com/darthjee/navi/issues/193

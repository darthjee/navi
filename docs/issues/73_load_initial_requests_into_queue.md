# Issue 73: Load Initial Parameter-Free ResourceRequests into Queue

## Background

When starting the Navi application, we want to pre-populate the job queue with `ResourceRequest` instances that do **not** require parameters. This ensures the cache-warming process can begin immediately, and subsequent parameterized requests can be enqueued as their dependencies are resolved (e.g., after fetching `/categories.json`, we can enqueue `/categories/:id/items.json` for each discovered `id`).

Currently, all jobs are enqueued only after the engine starts, and there is no filtering to ensure only parameter-free requests are loaded initially.

## Proposal

- On application startup, before starting the engine, enqueue all `ResourceRequest` jobs whose URLs do **not** require parameters.
- Parameterized requests (e.g., `/categories/:id/items.json`) should **not** be enqueued at this stage, as their parameters are only known after processing earlier responses.

## Implementation Steps

1. **Identify Parameter-Free Requests**
   - Each `ResourceRequest` must provide a method (e.g., `needsParams()`) to determine if its URL requires parameters.
   - Only requests where `needsParams()` returns `false` should be considered for initial enqueueing.

2. **Collect Eligible Requests**
   - Use the `ResourceRegistry` to collect all `ResourceRequest` instances.
   - Filter them using the `needsParams()` method.

3. **Enqueue Jobs**
   - Add all eligible (parameter-free) requests to the job queue before the engine starts.

## Acceptance Criteria

- On startup, only parameter-free `ResourceRequest` jobs are enqueued.
- Parameterized requests are only enqueued after their required parameters are available.
- The logic is covered by automated tests.
- Documentation is updated to describe the new startup flow.

## Benefits

- Ensures the queue is populated with valid jobs at startup.
- Prevents errors from enqueuing requests with missing parameters.
- Lays the groundwork for dynamic job enqueueing as new data is discovered.

---
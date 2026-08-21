# Engine and Workers

See [Worker Subsystem](../worker.md) for the class-by-class architectural reference to the `deku-swarm` package (`worker/`) — registries, factories, collections, `Engine`/`WorkersAllocator` — and for what stayed behind in Navi (job subclasses, `ResourceEnqueuer`, the auxiliary engine services). This page covers the loop and per-worker execution at a narrative, step-by-step level.

## Engine Loop

`ResourceRequestCollector.requestsNeedingNoParams()` finds all `ResourceRequest` entries with no `{:placeholder}` tokens and pushes them as `ResourceRequestJob`s to start the chain.

```
while (JobRegistry.hasJob() || WorkersRegistry.hasBusyWorker())
  JobRegistry.promoteReadyJobs()    ← move cooled-down failed jobs → retryQueue
  if JobRegistry.hasReadyJob()
    WorkersAllocator.allocate()     ← assign enqueued/retryQueue jobs to idle workers
  else
    await sleep(sleepMs)            ← all pending jobs still in cooldown; wait
```

`WorkersAllocator.allocate()` repeatedly pairs `WorkersRegistry.getIdleWorker()` with `JobRegistry.pick()` until either pool is exhausted.

---

## Worker Execution

Each `Worker` processes one job at a time:

1. **Resolve client** — look up the named client from `ClientRegistry` (or `default`).
2. **Resolve URL** — expand `{:placeholder}` tokens using the job's parameter map.
3. **Perform request** — `Client.perform()`; throws `RequestFailed` on status mismatch.
4. **Enqueue asset jobs** — if `resourceRequest.hasAssets()`, enqueue an `HtmlParseJob`.
5. **Enqueue action jobs** — `enqueueActions(responseWrapper)` → one `ActionProcessingJob` per `(item × action)` pair.
6. **Enqueue paginated action jobs** — `enqueuePaginatedActions(responseWrapper)` → one `PaginatedActionProcessingJob` per paginated action.
7. **Finish** — move job to finished; call `WorkersRegistry.setIdle(workerId)`.

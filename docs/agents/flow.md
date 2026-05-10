# Runtime Flow

## Startup

```
source/bin/navi.js
  └─ ArgumentsParser.parse()          — --config / -c → configPath
  └─ Application.loadConfig(configPath)
       ├─ Config  ──── clients + resources + workers + web + log
       │    ├─ ClientRegistry    (named HTTP clients)
       │    ├─ ResourceRegistry  (named resource groups)
       │    ├─ WorkersConfig     (pool size + retry cooldown + sleep + max-retries)
       │    ├─ WebConfig         (web server port — optional)
       │    └─ LogConfig         (log buffer size — optional)
       ├─ JobFactory.build()     — registers 5 job factories
       ├─ JobRegistry.build()    — singleton: enqueued / processing / failed /
       │                                       retryQueue / finished / dead
       └─ WorkersRegistry.build() + initWorkers()
            └─ WorkerFactory → Worker[]  (all start idle)
  └─ Application.run()
       ├─ buildEngine()          — Engine + WorkersAllocator
       ├─ buildWebServer()       — WebServer (null if web: absent)
       ├─ enqueueFirstJobs()     — parameter-free ResourceRequests → JobRegistry
       ├─ webServer?.start()     — Express on configured port
       └─ engine.start()         — allocation loop
```

---

## Configuration Structure

```yaml
workers:
  quantity: 5          # concurrent workers (default: 1)
  retry_cooldown: 2000 # ms before a failed job is retried (default: 2000)
  sleep: 500           # ms between allocation ticks (default: 500)
  max-retries: 3       # retries before a job is marked dead (default: 3)

log:
  size: 100            # max log entries in memory (default: 100)

web:
  port: 3000           # port for the monitoring web UI (omit to disable)

failure:
  threshold: 10.0      # exit non-zero if more than 10% of jobs are dead (optional)

clients:
  default:
    base_url: https://example.com
    linkText: Main Website   # optional; used by GET /links.json (defaults to client key)
    timeout: 5000            # optional; ms (default: 5000)
  auth_api:
    base_url: https://api.example.com
    headers:
      Authorization: Bearer <token>

resources:
  categories:
    - url: /categories.json
      status: 200
      actions:
        - resource: category_information  # no parameters → all fields pass through
        - resource: products
          parameters:
            category_id: parsedBody.id   # extract "id" from parsed body
      paginated_actions:
        - resource: products_page
          pagination:
            - pages: parsedBody.pagination.pages
            - page_key: page
            - zero_indexed: false
  category_information:
    - url: /categories/{:id}.json
      status: 200
      client: auth_api
  products:
    - url: /categories/{:category_id}/products.json
      status: 200
  home_page:
    - url: /
      status: 200
      assets:
        - selector: 'link[rel="stylesheet"]'
          attribute: href
          status: 200
        - selector: 'script[src]'
          attribute: src
```

> **Path expression namespace: `parsedBody` is camelCase.**
> Always write `parsedBody.field` — never `parsed_body.field`. Valid namespaces: `parsedBody`, `headers`, `parameters`.
>
> **Header names are always lowercase.**
> Node.js normalizes HTTP response header names to lowercase before they reach Navi. Always use lowercase when referencing headers (e.g. `headers['x-total-pages']`, not `headers['X-Total-Pages']`).

---

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

---

## Actions

`ActionProcessingJob.perform()` calls `action.execute(item)`:

1. `ParametersMapper` maps path expressions from the response to parameters.
2. Looks up the target resource in `ResourceRegistry`.
3. Enqueues one `ResourceRequestJob` per `ResourceRequest` in that resource with the mapped parameters.

`ActionProcessingJob` has **no retry rights** — exhausted on the first failure.

---

## Paginated Actions

`PaginatedActionProcessingJob.perform()` calls `paginatedAction.execute(responseWrapper)`:

1. `PaginationConfig.resolvePages(responseWrapper)` evaluates the `pages` expression → total page count.
2. `PaginationConfig.pageNumbers(count)` generates `[1..count]` or `[0..count-1]` depending on `zero_indexed`.
3. Enqueues one `ResourceRequestJob` per page, merging the page number under `page_key` into existing parameters.

`PaginatedActionProcessingJob` has **no retry rights**.

---

## Asset Processing

When a `ResourceRequest` declares `assets`, the response body is treated as HTML:

1. `HtmlParseJob` runs `HtmlParser.parse(rawHtml, selector, attribute)` for each rule.
2. Resolves each URL to absolute form: absolute → as-is; `//…` → prepend `https:`; `/…` → prepend client's `baseUrl`.
3. Enqueues one `AssetDownloadJob` per resolved URL.
4. `AssetDownloadJob` fetches the URL via `Client.performUrl()` — leaf node with standard retry/dead path.

`HtmlParseJob` has **no retry rights**.

---

## Failure Handling

1. Job failure counter is incremented; last exception stored.
2. If not exhausted: `job.applyCooldown(cooldown)` sets `readyBy = Date.now() + cooldown`. Job goes to the `failed` `SortedCollection`.
3. If exhausted: job moves to `dead`.
4. `JobRegistry.promoteReadyJobs()` (each engine tick) moves jobs with `readyBy ≤ Date.now()` back to `retryQueue`.

`ResourceRequestJob` retries up to `max-retries` times. `ActionProcessingJob`, `PaginatedActionProcessingJob`, and `HtmlParseJob` are exhausted after the **first** failure.

---

## Failure Threshold

After `Application.run()` finishes, if the config has a `failure:` key:

- `ratio = (dead / (dead + finished)) * 100`
- If `ratio > threshold`, `process.exit(1)` is called so CI pipelines detect partial failure.

---

## Engine Lifecycle States

| Status | Meaning |
|--------|---------|
| `running` | Engine loop is active and processing jobs. |
| `pausing` | Pause requested; waiting for active workers to finish. |
| `paused` | Engine loop stopped; jobs remain in queues. |
| `stopping` | Stop requested; waiting for active workers to finish. |
| `stopped` | Engine loop stopped; all job queues cleared. |

### Transitions

```
running  ──[PATCH /engine/pause]──►  pausing  ──[workers idle]──►  paused
running  ──[PATCH /engine/stop]───►  stopping ──[workers idle]──►  stopped
running  ──[PATCH /engine/restart]►  stopping ──[workers idle]──►  running
paused   ──[PATCH /engine/continue]──────────────────────────────►  running
stopped  ──[PATCH /engine/start]─────────────────────────────────►  running
```

Any call-site that enqueues a side-effect job checks `Application.isStopped()` before calling `JobRegistry.enqueue()`. If stopped, the enqueue is silently skipped.

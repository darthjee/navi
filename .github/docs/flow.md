# Runtime Flow

## Overview

Navi is a queue-based cache-warmer. It reads a YAML configuration file, enqueues HTTP requests as jobs, and processes them concurrently using a pool of workers.

```
navi.js (CLI entrypoint — project root)
  └─ Application.loadConfig(configPath)
       ├─ Config  ──────────────────────────────────────── clients + resources
       │    ├─ ClientRegistry   (named HTTP clients)
       │    ├─ ResourceRegistry (named resource groups)
       │    └─ WorkersConfig    (pool size)
       ├─ JobRegistry  ──── main queue + failed queue + deadJobs + finished list
       └─ WorkersRegistry ─ idle/busy worker pool (created via WorkersFactory)
            └─ Worker[]  ──── each processes one Job at a time (async)
                 └─ Client.perform(resourceRequest, params)
                      └─ ResponseParser → enqueue follow-up actions
```

---

## 1. Entrypoint — `navi.js`

The CLI script `navi.js` (project root) reads command-line arguments to determine which YAML configuration file to load.
It instantiates `Application`, calls `loadConfig(configPath)`, and then starts the `Engine`.

---

## 2. Configuration Loading

`Application.loadConfig(configPath)` orchestrates initialization:

1. `ConfigLoader` reads the YAML file from disk (`fs.readFileSync` + `yaml` library).
2. `ConfigParser` validates required top-level keys and builds:
   - `ClientRegistry` — named HTTP client definitions (`base_url`, optional headers/auth).
   - `ResourceRegistry` — named resource groups, each containing one or more `ResourceRequest` entries.
   - `WorkersConfig` — worker pool size (`workers.quantity`, default 1).
3. `JobRegistry` is created (empty queues).
4. `WorkersRegistry` is created and `initWorkers()` is called, which uses **`WorkersFactory`** (planned — not yet implemented) to instantiate the configured number of `Worker` instances (each with a UUID).

---

## 3. Configuration Structure

```yaml
workers:
  quantity: 5          # number of concurrent workers

clients:
  default:
    base_url: https://example.com
  auth_api:
    base_url: https://api.example.com
    headers:
      Authorization: Bearer <token>

resources:
  categories:
    - url: /categories.html
      status: 302
    - url: /categories.json
      status: 200
      actions:
        - resource: category
          params:
            id: id          # map response field "id" → placeholder {:id}
        - resource: items
          params:
            category_id: id # map response field "id" → placeholder {:category_id}
  category:
    - url: /categories/{:id}.html
      status: 302
    - url: /categories/{:id}.json
      status: 200
      client: auth_api      # use a specific named client for this request
```

Each `ResourceRequest` entry may specify:

- `url` — URL template, optionally containing `{:placeholder}` tokens.
- `status` — expected HTTP response status code.
- `client` — name of the client to use (falls back to `default`).
- `actions` — list of downstream resources to enqueue after a successful response, with parameter mappings.

---

## 4. Initial Enqueueing

After `loadConfig`, `Application` iterates over all `ResourceRequest` entries across all resources and enqueues those that **require no parameters** (i.e., their URL contains no `{:placeholder}` tokens).

`JobRegistry.enqueue(resourceRequest, params)`:
1. Delegates to **`JobFactory`** to create a new `Job` wrapping the `ResourceRequest` and parameter map.
2. Calls `push(job)` to add the job to the tail of the main queue.

---

## 5. Engine Loop

**`Engine`** drives the processing lifecycle.

### Outer loop — runs while there is remaining work

Remaining work means: at least one busy worker **or** at least one job in the queue.

- `WorkersRegistry.hasBusyWorker()` — returns `true` if any worker is currently processing.
- `JobRegistry.hasJob()` — returns `true` if there are jobs to process (considers both the main queue and the failed queue).

If no idle workers are available but work remains, the Engine **sleeps** for a configurable duration before retrying.

### Inner loop — assigns jobs to idle workers

While `WorkersRegistry.hasIdleWorker()` **and** `JobRegistry.hasJob()`:

1. Pick the next job from the main queue (`JobRegistry.pick()`).
2. Retrieve an idle worker from `WorkersRegistry`.
3. Mark the worker as busy (`WorkersRegistry.setBusy(workerId)`).
4. Dispatch the job to the worker **asynchronously** (non-blocking) to enable parallelism.

When the main queue is empty, the inner loop may promote jobs from the failed queue back to the main queue, giving previously failed requests a retry window after the rest of the work has been attempted.

---

## 6. Worker Execution

Each `Worker` processes one job at a time asynchronously:

1. **Resolve client** — look up the client named in `ResourceRequest` (or `default`) from `ClientRegistry`.
2. **Resolve URL** — expand `{:placeholder}` tokens in the URL template using the job's parameter map.
3. **Perform request** — call `Client.perform(resourceRequest, params)`; throws `RequestFailed` if the response status does not match the expected status.
4. **Parse response** — pass the HTTP response body to **`ResponseParser`**, which extracts the data needed for downstream jobs.
5. **Enqueue actions** — for each entry in `ResourceRequest.actions`, call `JobRegistry.enqueue(downstreamRequest, mappedParams)` using the parameter mappings defined in the action configuration.
6. **Finish** — mark the job as finished and store it in `JobRegistry`'s finished list; call `WorkersRegistry.setIdle(workerId)` so the worker re-enters the idle pool.

### Action Parameter Mapping Example

Given a response body `[{ id: 1 }, { id: 2 }]` and the following actions config:

```yaml
actions:
  - resource: category
    params:
      id: id          # job param "id" = response field "id"
  - resource: items
    params:
      category_id: id # job param "category_id" = response field "id"
```

For each item in the response array, two sets of jobs are enqueued — **4 jobs in total** (2 resources × 2 IDs):

- All `ResourceRequest` entries under `category` with `params: { id: 1 }` and `{ id: 2 }` (2 jobs).
- All `ResourceRequest` entries under `items` with `params: { category_id: 1 }` and `{ category_id: 2 }` (2 jobs).

---

## 7. Failure Handling

When a job fails (e.g., `RequestFailed` is thrown):

1. The job's **failure counter** is incremented and the **last exception** is stored on the job.
2. If the failure count is within the configured maximum, the job is moved to the **failed queue**.
3. If the failure count exceeds the configured maximum, the job is moved to **`deadJobs`**.

The failed queue is only promoted to the main queue **after the main queue is empty**, giving the server time to recover from transient errors before retrying.

All queues (`main`, `failed`, `finished`, `deadJobs`) are managed inside `JobRegistry`.

---

## 8. Future Web UI

When enabled by configuration, `Application` will start a local web server (built with React + React Bootstrap — dependencies already included).

The web UI will display:

- Jobs currently in queue.
- Jobs being processed.
- Finished jobs.
- Failed jobs (with last failure reason).
- Dead jobs (exceeded retry limit).

This interface is read-only and is intended for monitoring ongoing or recent runs.

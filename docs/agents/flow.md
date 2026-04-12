# Runtime Flow

## Overview

Navi is a queue-based cache-warmer. It reads a YAML configuration file, enqueues HTTP requests as jobs, and processes them concurrently using a pool of workers.

```
source/bin/navi.js
  └─ ArgumentsParser.parse()          — --config / -c → configPath
  └─ Application.loadConfig(configPath)
       ├─ Config  ────────────────────────────────── clients + resources + workers + web
       │    ├─ ClientRegistry    (named HTTP clients)
       │    ├─ ResourceRegistry  (named resource groups)
       │    ├─ WorkersConfig     (pool size + retry cooldown)
       │    └─ WebConfig         (web server port — optional)
       ├─ JobFactory.build()     — registers 'ResourceRequestJob' and 'Action' factories
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
            └─ WorkersAllocator.allocate()
                 └─ Worker.perform(job)
                      ├─ [ResourceRequestJob]
                      │    └─ Client.perform()              → raw response body
                      │    └─ ResponseParser.parse()        → JS value
                      │    └─ ActionsEnqueuer.enqueue()     — item × action cross-product
                      │         └─ ActionEnqueuer.enqueue() (per action)
                      │              └─ JobRegistry.enqueue('Action', { action, item })
                      └─ [ActionProcessingJob]
                           └─ action.execute(item)          ← TODO: enqueue ResourceRequestJob
                                └─ ParametersMapper.map(item) → log vars (current behaviour)
```

---

## 1. Entrypoint — `source/bin/navi.js`

`source/bin/navi.js` uses `ArgumentsParser.parse(process.argv.slice(2))` to read the
`--config <path>` / `-c <path>` option (default: `config/navi_config.yml`).
It instantiates `Application`, calls `loadConfig(configPath)`, and then calls `run()`.

---

## 2. Configuration Loading

`Application.loadConfig(configPath)` orchestrates initialization:

1. `ConfigLoader` reads the YAML file from disk (`fs.readFileSync` + `yaml` library).
   Throws `ConfigurationFileNotProvided` if `configPath` is falsy.
   Throws `ConfigurationFileNotFound` if the file does not exist.
2. `ConfigParser` validates required top-level keys and builds:
   - `ClientRegistry` — named HTTP client definitions (`base_url`, optional `headers` with env var interpolation).
   - `ResourceRegistry` — named resource groups, each containing one or more `ResourceRequest` entries.
   - `WorkersConfig` — worker pool size (`workers.quantity`, default 1) and `retryCooldown`.
   - `WebConfig` — web server port (`web.port`); `null` when the `web:` key is absent.
3. `JobFactory.build('ResourceRequestJob', ...)` and `JobFactory.build('Action', ...)` register the two job factories.
4. `JobRegistry.build({ cooldown })` creates the singleton with empty queues.
5. `WorkersRegistry.build(workersConfig)` creates the singleton; `WorkersRegistry.initWorkers()` calls `WorkerFactory` to create the configured number of `Worker` instances (all start idle).

---

## 3. Configuration Structure

```yaml
workers:
  quantity: 5          # number of concurrent workers

web:
  port: 3000           # port for the monitoring web UI (omit to disable)

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
        - resource: category_information  # no parameters → all fields pass through
        - resource: products
          parameters:
            category_id: parsed_body.id   # extract "id" from parsed body → variable "category_id"
  category_information:
    - url: /categories/{:id}.json
      status: 200
      client: auth_api      # use a specific named client for this request
      actions:
        - resource: kind
          parameters:
            id: parsed_body.kind_id       # extract "kind_id" from parsed body → variable "id"
  products:
    - url: /categories/{:category_id}/products.json
      status: 200
  kind:
    - url: /kinds/{:id}.json
      status: 200
```

Each `ResourceRequest` entry may specify:

- `url` — URL template, optionally containing `{:placeholder}` tokens.
- `status` — expected HTTP response status code.
- `client` — name of the client to use (falls back to `default`).
- `actions` — optional list of actions to execute after a successful response (see section 6).

The optional top-level `web:` key configures the monitoring web UI:

- `port` — TCP port where the Express web server listens. Omit the `web:` key entirely to run Navi without a web server.

---

## 4. Initial Enqueueing

After `loadConfig`, `Application.run()` calls `enqueueFirstJobs()`:

`ResourceRequestCollector.requestsNeedingNoParams()` returns all `ResourceRequest` entries
whose URL template contains no `{:placeholder}` tokens. Each one is pushed as a
`ResourceRequestJob` via `JobRegistry.enqueue('ResourceRequestJob', { resourceRequest, parameters: {} })`.

`JobRegistry.enqueue(factoryKey, params)`:

1. Retrieves the factory registered under `factoryKey` from `JobFactory`.
2. Calls `factory.build(params)` to create a new `Job` instance.
3. Pushes the job to the tail of the `enqueued` queue.

---

## 5. Engine Loop

**`Engine`** drives the processing lifecycle by delegating job assignment to the `WorkersAllocator`.

### Main allocation loop

```
while (JobRegistry.hasJob() || WorkersRegistry.hasBusyWorker())
  JobRegistry.promoteReadyJobs()    ← move cooled-down failed jobs → retryQueue
  if JobRegistry.hasReadyJob()
    WorkersAllocator.allocate()     ← assign enqueued/retryQueue jobs to idle workers
  else
    await sleep(sleepMs)            ← all pending jobs still in cooldown; wait
```

`hasJob()` returns `true` when any of `enqueued`, `failed`, or `retryQueue` is non-empty.
`hasReadyJob()` returns `true` only when `enqueued` or `retryQueue` is non-empty.

`WorkersAllocator.allocate()` repeatedly pairs `WorkersRegistry.getIdleWorker()` with
`JobRegistry.pick()` until either pool is exhausted for the current tick. `getIdleWorker()`
atomically moves a worker from idle to busy and returns it.

The loop stops when all jobs have been processed or moved to dead, and all workers are idle.

---

## 6. Worker Execution

Each `Worker` processes one job at a time asynchronously:

1. **Resolve client** — look up the client named in `ResourceRequest` (or `default`) from `ClientRegistry`.
2. **Resolve URL** — expand `{:placeholder}` tokens in the URL template using the job's parameter map.
3. **Perform request** — call `Client.perform(resourceRequest, params)`; throws `RequestFailed` if the response status does not match the expected status. The response body is returned as raw text (`responseType: 'text'`).
4. **Enqueue action jobs** — call `resourceRequest.enqueueActions(rawBody, jobRegistry)` to parse the response and enqueue one `ActionProcessingJob` per `(item × action)` pair (see section 7).
5. **Finish** — mark the job as finished and store it in `JobRegistry`'s finished list; call `WorkersRegistry.setIdle(workerId)` so the worker re-enters the idle pool.

---

## 7. Response Processing & Actions

After `Client.perform()` resolves, `ResourceRequestJob` passes the raw response body to
`resourceRequest.enqueueActions(rawBody)`.

- `ResourceRequest.enqueueActions` returns immediately if there are no configured actions.
- **`ResponseParser`** parses the raw JSON body once. Throws `InvalidResponseBody` if it cannot be parsed.
- **`ActionsEnqueuer`** receives the parsed value. Throws `NullResponse` if the value is `null`.
  Normalises the value to an array (wrapping a single object), then, for each action, creates an
  **`ActionEnqueuer`** and calls `enqueue()`.
- **`ActionEnqueuer.enqueue()`** iterates over all items and calls
  `JobRegistry.enqueue('Action', { action, item })` for each one, creating an `ActionProcessingJob`.
- **`ActionProcessingJob.perform()`** calls `action.execute(item)`.
- **`ResourceRequestAction.execute(item)`** applies `ParametersMapper.map(item)` to obtain
  the parameters, looks up the target resource in `ResourceRegistry`, and enqueues one
  `ResourceRequestJob` per `ResourceRequest` in that resource, passing the mapped variables
  as job parameters. The URL `{:placeholder}` tokens are resolved at request time inside
  `Client.perform()` via `ResourceRequest.resolveUrl(parameters)`.
- `ActionProcessingJob` has no retry rights — it is exhausted immediately on the first failure.

### Example

Given a response body `[{ "id": 1 }, { "id": 2 }]` and the following actions config:

```yaml
actions:
  - resource: products
    parameters:
      category_id: parsed_body.id   # extract "id" from parsed body → variable "category_id"
  - resource: category_information
```

`ResourceRequestJob` enqueues **4** `ActionProcessingJob` instances (2 items × 2 actions). Each job then executes its action, which enqueues `ResourceRequestJob` instances with resolved URLs:

```
ResourceRequestJob for /products/{:category_id}.json with { category_id: 1 }
ResourceRequestJob for /category_information/{:id}.json with { id: 1 }
ResourceRequestJob for /products/{:category_id}.json with { category_id: 2 }
ResourceRequestJob for /category_information/{:id}.json with { id: 2 }
```

When each `ResourceRequestJob` performs, `Client.perform()` calls `resolveUrl(parameters)` to produce the final request URLs (e.g., `/products/1.json`, `/category_information/1.json`).

---

## 8. Failure Handling

When a job fails (e.g., `RequestFailed` is thrown):

1. The job's **failure counter** is incremented and the **last exception** is stored on the job.
2. `job.exhausted()` is checked:
   - `ResourceRequestJob`: not exhausted until the failure count exceeds the configured maximum.
   - `ActionProcessingJob`: exhausted after the **first** failure (no retry rights).
3. If not exhausted: `job.applyCooldown(cooldown)` sets `job.readyBy = Date.now() + cooldown`.
   The job is inserted into the `failed` `SortedCollection` (sorted by `readyBy`).
4. If exhausted: the job is moved to the `dead` collection.

`JobRegistry.promoteReadyJobs()` (called at the start of each engine tick) moves all
`failed` jobs whose `readyBy ≤ Date.now()` into `retryQueue`, where they are treated as
regular ready jobs on the next allocation.

All queues (`enqueued`, `processing`, `failed`, `retryQueue`, `finished`, `dead`) are
managed inside `JobRegistryInstance`, accessed via the `JobRegistry` singleton facade.

---

## 9. Web UI

When the `web:` key is present in the configuration, `Application` starts a local
**read-only monitoring web UI** built with React, served by an Express.js `WebServer`.

```yaml
web:
  port: 3000
```

Omit the `web:` key entirely to run Navi in headless mode (no web server).

### Current routes

| Route | Handler | Description |
|-------|---------|-------------|
| `GET /stats.json` | `StatsRequestHandler` | Returns `{ jobs, workers }` with counts per state. |
| `GET /*` | static + SPA fallback | Serves the React app from `source/public/`. |

### `jobs` object (from `JobRegistry.stats()`)

```json
{
  "enqueued":   0,
  "processing": 0,
  "failed":     0,
  "retryQueue": 0,
  "finished":   0,
  "dead":       0
}
```

### `workers` object (from `WorkersRegistry.stats()`)

```json
{ "idle": 5, "busy": 0 }
```

### Planned web UI features

- List individual jobs per queue/state (URL, status, failure reason).
- List individual workers with their current state and active job.
- Display jobs in cooldown with time remaining until retry.
- View application logs (`BufferedLogger` / `LogBuffer`).
- Real-time updates (polling or WebSocket).

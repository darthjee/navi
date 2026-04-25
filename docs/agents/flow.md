# Runtime Flow

## Overview

Navi is a queue-based cache-warmer. It reads a YAML configuration file, enqueues HTTP requests as jobs, and processes them concurrently using a pool of workers.

```
source/bin/navi.js
  └─ ArgumentsParser.parse()          — --config / -c → configPath
  └─ Application.loadConfig(configPath)
       ├─ Config  ────────────────────────────────── clients + resources + workers + web + log
       │    ├─ ClientRegistry    (named HTTP clients)
       │    ├─ ResourceRegistry  (named resource groups)
       │    ├─ WorkersConfig     (pool size + retry cooldown)
       │    ├─ WebConfig         (web server port — optional)
       │    └─ LogConfig         (log buffer size — optional)
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
   - `ClientRegistry` — named HTTP client definitions (`base_url`, optional `timeout` in ms, optional `headers` with env var interpolation).
   - `ResourceRegistry` — named resource groups, each containing one or more `ResourceRequest` entries.
   - `WorkersConfig` — worker pool size (`workers.quantity`, default 1), retry cooldown (`workers.retry_cooldown`, default 2000 ms), engine sleep interval (`workers.sleep`, default 500 ms), and max retries (`workers.max-retries`, default 3).
   - `WebConfig` — web server port (`web.port`); `null` when the `web:` key is absent.
   - `LogConfig` — log buffer size (`log.size`, default 100); uses default when the `log:` key is absent.
3. `JobFactory.build('ResourceRequestJob', ...)`, `JobFactory.build('Action', ...)`, `JobFactory.build('HtmlParse', ...)`, and `JobFactory.build('AssetDownload', ...)` register the four job factories.
4. `JobRegistry.build({ cooldown })` creates the singleton with empty queues.
5. `WorkersRegistry.build(workersConfig)` creates the singleton; `WorkersRegistry.initWorkers()` calls `WorkerFactory` to create the configured number of `Worker` instances (all start idle).

---

## 3. Configuration Structure

```yaml
workers:
  quantity: 5          # number of concurrent workers (default: 1)
  retry_cooldown: 2000 # ms before a failed job is retried (default: 2000)
  sleep: 500           # ms the engine waits between allocation ticks (default: 500)
  max-retries: 3       # max number of retries before a job is marked dead (default: 3)

log:
  size: 100            # max log entries kept in memory (default: 100)

web:
  port: 3000           # port for the monitoring web UI (omit to disable)

clients:
  default:
    base_url: https://example.com
    timeout: 5000            # optional; ms before the request times out (default: 5000)
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
            category_id: parsedBody.id   # extract "id" from parsed body → variable "category_id"
  category_information:
    - url: /categories/{:id}.json
      status: 200
      client: auth_api      # use a specific named client for this request
      actions:
        - resource: kind
          parameters:
            id: parsedBody.kind_id       # extract "kind_id" from parsed body → variable "id"
  products:
    - url: /categories/{:category_id}/products.json
      status: 200
  kind:
    - url: /kinds/{:id}.json
      status: 200
  home_page:
    - url: /
      status: 200
      assets:
        - selector: 'link[rel="stylesheet"]'  # CSS selector to match elements
          attribute: href                       # attribute whose value is the asset URL
          status: 200                           # expected status when fetching the asset
        - selector: 'script[src]'
          attribute: src
```

Each `ResourceRequest` entry may specify:

- `url` — URL template, optionally containing `{:placeholder}` tokens.
- `status` — expected HTTP response status code.
- `client` — name of the client to use (falls back to `default`).
- `actions` — optional list of actions to execute after a successful response (see section 6).
- `assets` — optional list of asset extraction rules (see section 7). When declared, the response body is treated as HTML and the listed selector+attribute rules are used to discover asset URLs, each of which is fetched as an `AssetDownloadJob`.

The optional top-level `workers:` key configures the worker pool:

- `quantity` — number of concurrent workers (default: `1`).
- `retry_cooldown` — milliseconds a failed job waits before being re-queued for retry (default: `2000`).
- `sleep` — milliseconds the engine waits between allocation ticks when all pending jobs are in cooldown (default: `500`).
- `max-retries` — maximum number of times a job is retried before being moved to the dead queue (default: `3`).

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
4. **Enqueue asset jobs** — if `resourceRequest.hasAssets()`: call `resourceRequest.enqueueAssets(rawBody, jobRegistry, clientRegistry)` to enqueue a `HtmlParseJob` that will extract and fetch asset URLs (see section 8).
5. **Enqueue action jobs** — call `resourceRequest.enqueueActions(responseWrapper)` to parse the response and enqueue one `ActionProcessingJob` per `(item × action)` pair (see section 7). This is a no-op if the resource has no actions configured.
6. **Finish** — mark the job as finished and store it in `JobRegistry`'s finished list; call `WorkersRegistry.setIdle(workerId)` so the worker re-enters the idle pool.

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
      category_id: parsedBody.id   # extract "id" from parsed body → variable "category_id"
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

## 8. Asset Processing

When a `ResourceRequest` declares an `assets` list, the response body is treated as **HTML** rather than JSON.
After a successful HTTP response in `ResourceRequestJob`:

1. `resourceRequest.hasAssets()` returns `true`.
2. `resourceRequest.enqueueAssets(rawBody, jobRegistry, clientRegistry)` is called.
3. `JobRegistry.enqueue('HtmlParse', { rawHtml, assetRequests, clientRegistry })` creates an **`HtmlParseJob`**.
4. **`HtmlParseJob.perform()`** iterates over the `assetRequests`:
   - Calls **`HtmlParser.parse(rawHtml, selector, attribute)`** for each rule, returning an array of URL strings.
   - Resolves each URL to an absolute form:
     - Absolute (`https://…` / `http://…`) — used as-is.
     - Protocol-relative (`//…`) — prepended with `https:`.
     - Root-relative (`/…`) — concatenated with the named client's `baseUrl`.
   - Enqueues one **`AssetDownloadJob`** per resolved URL via `JobRegistry.enqueue('AssetDownload', { url, client, status })`.
5. **`AssetDownloadJob.perform()`** fetches the fully-resolved URL using `client.performUrl(url, expectedStatus)`.
   - Validates the HTTP status against the configured `status` (default 200).
   - Throws `RequestFailed` if the status does not match.
   - Follows the standard retry/dead path.
   - Is a **leaf node** — no further chaining after a successful fetch.
6. `HtmlParseJob` has **no retry rights** — exhausted after the first failure.

> **Note:** A `ResourceRequest` may declare both `assets` and `actions`. Both run independently:
> `enqueueAssets` is called for HTML asset extraction, and `enqueueActions` is called for JSON
> response chaining. In practice, a resource would only declare one or the other.

---

## 9. Failure Handling

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

## 10. Web UI

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
| `GET /jobs/:status.json` | `JobsRequestHandler` | Returns an array of jobs in the given status queue. |
| `GET /job/:id.json` | `JobRequestHandler` | Returns details for a specific job by ID (404 if not found). |
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

### Job list item (from `GET /jobs/:status.json`)

```json
{ "id": "abc-123", "status": "enqueued", "attempts": 0 }
```

Valid `:status` values: `enqueued`, `processing`, `failed`, `retryQueue`, `finished`, `dead`.
Returns an empty array for unknown status values.

### Job detail (from `GET /job/:id.json`)

```json
{ "id": "abc-123", "status": "enqueued", "attempts": 0 }
```

Returns `404` with `{ "error": "Job not found" }` when no job matches the given ID.

### `workers` object (from `WorkersRegistry.stats()`)

```json
{ "idle": 5, "busy": 0 }
```

### Planned web UI features

- List individual workers with their current state and active job.
- Display jobs in cooldown with time remaining until retry.
- View application logs (`BufferedLogger` / `LogBuffer`).
- Real-time updates (polling or WebSocket).


---

## Local Dev Request Flow

When running the full local development stack (`docker-compose up`), requests are routed as follows:

```
Browser ──► navi_proxy (:3010)
               ├─ GET *.json  ──► navi_dev_app (:3020)   (proxied + cached)
               └─ GET *       ──► dev/proxy/static/       (React SPA static files)
                                   └─ index.html           (SPA fallback for client-side routes)

navi_app ──► navi_proxy (:3010) ──► navi_dev_app (:3020)  (cache-warming)
```

### Services involved

| Service | Role |
|---------|------|
| `navi_dev_app` | Express JSON API backend (`dev/app/`) |
| `navi_dev_frontend` | Builds the React SPA (`dev/frontend/`) into `dev/proxy/static/` |
| `navi_proxy` | Tent reverse proxy: serves static SPA files and proxies API requests |
| `navi_app` | Navi cache-warmer; issues requests to the proxy |

### Startup order

1. `navi_dev_app` starts (Express server on port 80).
2. `navi_dev_frontend` runs `yarn build` (Vite), writing `dist/` to `dev/proxy/static/`.
3. `navi_proxy` starts (depends on both above services).
4. `navi_app` starts (depends on `navi_proxy`).

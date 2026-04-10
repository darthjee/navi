# Application Overview

## What is Navi?

Navi is a **queue-based cache-warmer** written in Node.js, designed to run inside Docker.
It reads a YAML configuration file, discovers which HTTP resources can be requested
immediately (no parameters required), fires those requests concurrently, and chains the
responses into further requests — repeating until the entire resource graph has been
warmed.

A read-only **web monitoring interface** is available optionally for observing the state
of jobs and workers in real time.

---

## Core Flow

```
bin/navi.js
  └─ ArgumentsParser.parse()     — reads --config / -c CLI option
  └─ Application.loadConfig()    — reads YAML, builds registries, registers factories
  └─ Application.run()
       ├─ buildEngine()           — creates Engine + WorkersAllocator
       ├─ buildWebServer()        — creates Express WebServer (if web: key present)
       ├─ enqueueFirstJobs()      — collects parameter-free ResourceRequests → JobRegistry
       ├─ webServer.start()       — starts Express on configured port (optional)
       └─ engine.start()          — drives the allocation loop until all work is done
            └─ WorkersAllocator.allocate()
                 └─ Worker.perform(job)
                      ├─ [ResourceRequestJob]
                      │    └─ Client.perform()          — HTTP request via Axios
                      │    └─ ResponseParser.parse()    — raw body → JS value
                      │    └─ ActionsEnqueuer.enqueue() — item × action → ActionProcessingJob
                      │         └─ ActionEnqueuer.enqueue() (per action)
                      │              └─ JobRegistry.enqueue('Action', { action, item })
                      └─ [ActionProcessingJob]          ← TODO: enqueue new ResourceRequestJob
                           └─ action.execute(item)
                                └─ VariablesMapper.map(item) → logs variables (current)
```

---

## Startup Sequence

1. **Parse CLI args** — `ArgumentsParser.parse(process.argv.slice(2))` returns `{ config }`.
   Default config path: `config/navi_config.yml`.

2. **Load config** — `Config.fromFile(configPath)` reads the YAML file and builds:
   - `ClientRegistry` — named HTTP clients (base URL, headers, auth).
   - `ResourceRegistry` — named resource groups, each with one or more `ResourceRequest`
     entries (URL template, expected status, optional actions list).
   - `WorkersConfig` — pool size and retry cooldown.
   - `WebConfig` — web server port (absent → no web server).

3. **Bootstrap registries** — `Application.#initRegistries()`:
   - Registers `'ResourceRequestJob'` and `'Action'` factories in `JobFactory`.
   - Builds the `JobRegistry` singleton (empty queues + cooldown).
   - Builds the `WorkersRegistry` singleton and calls `initWorkers()` to create
     the configured number of `Worker` instances (all start idle).

4. **Enqueue initial jobs** — `ResourceRequestCollector.requestsNeedingNoParams()` finds all
   `ResourceRequest` entries whose URL contains no `{:placeholder}` tokens.
   Each one is pushed to the `JobRegistry` as a `ResourceRequestJob`.

5. **Start web server** (optional) — `WebServer.start()` listens on the configured port.

6. **Start engine** — `Engine.start()` drives the allocation loop.

---

## Engine Loop

```
while (hasJob() || hasBusyWorker())
  promoteReadyJobs()          ← move cooled-down failed jobs back to retryQueue
  if hasReadyJob()
    WorkersAllocator.allocate()   ← assign enqueued/retryQueue jobs to idle workers
  else
    sleep(sleepMs)            ← all pending jobs are in cooldown; wait before retrying
```

`WorkersAllocator.allocate()` repeatedly pairs an idle worker with a ready job until
either pool is exhausted for the current tick.

---

## Job States

```
enqueued ──► processing ──► finished
                 │
                 └──► failed (cooldown) ──► retryQueue ──► processing
                 │
                 └──► dead  (exhausted — too many failures)
```

- `ActionProcessingJob` is **exhausted after one failure** (no retry rights).
- `ResourceRequestJob` retries up to the configured maximum, with cooldown between attempts.

---

## Resource Chaining

The intended full cycle (partially implemented):

```
ResourceRequest (no params)
  → HTTP response
    → parse JSON
      → for each item × action:
          → ActionProcessingJob
            → apply variables_map
              → enqueue new ResourceRequestJob (with params)  ← TODO
                → HTTP response
                  → parse JSON
                    → ... (recursive chaining)
```

Currently, `ActionProcessingJob` only **logs** the mapped variables instead of enqueueing
a new `ResourceRequestJob`. The enqueue step is the next implementation target.

---

## Web Interface

An optional Express.js server provides a React SPA for monitoring. It is enabled by
adding the `web:` key to the configuration file.

```yaml
web:
  port: 3000
```

The React frontend is served from `source/public/`. The backend exposes:

| Route | Description |
|-------|-------------|
| `GET /stats.json` | Combined job and worker statistics (counts per state). |
| `GET /*` | Serves the React SPA (`index.html` fallback). |

---

## Implementation Checklist

### Core Engine

- [x] CLI entrypoint (`source/bin/navi.js`) with `ArgumentsParser`
- [x] Configuration loading from YAML (`ConfigLoader`, `ConfigParser`)
- [x] `Config` model with `ResourceRegistry`, `ClientRegistry`, `WorkersConfig`, `WebConfig`
- [x] `ResourceRequestCollector` — identifies parameter-free resources for initial enqueueing
- [x] Initial enqueueing of parameter-free `ResourceRequest`s at startup
- [x] `JobRegistry` singleton — multi-state queues: enqueued, processing, failed, retryQueue, finished, dead
- [x] `WorkersRegistry` singleton — idle/busy worker pool tracking
- [x] `WorkerFactory` — creates `Worker` instances with unique IDs
- [x] `Engine` loop with `WorkersAllocator`
- [x] `Worker` execution of `ResourceRequestJob` (HTTP via Axios)
- [x] Response parsing (`ResponseParser`) — raw JSON body → JS value
- [x] `ActionsEnqueuer` + `ActionEnqueuer` — cross-product (item × action) → `ActionProcessingJob` queue
- [x] `ActionProcessingJob` execution via `action.execute(item)` + `VariablesMapper`
- [x] Retry with cooldown for failed `ResourceRequestJob`s (`SortedCollection` by `readyBy`)
- [x] Dead job tracking (jobs that exhaust retry allowance)

### Resource Chaining

- [ ] `ResourceRequestAction.execute()` should enqueue a new `ResourceRequestJob` with
      mapped parameters instead of only logging them
      *(currently logs `"Executing action <resource> for <vars>"`)*

### Web Interface

- [x] Express `WebServer` with React SPA (served from `source/public/`)
- [x] `GET /stats.json` — aggregate counts for jobs and workers
- [ ] Web UI: list individual jobs per queue/state (enqueued, processing, failed, dead, finished)
- [ ] Web UI: list individual workers with their current state (idle / busy + current job)
- [ ] Web UI: display jobs in cooldown with time remaining until retry
- [ ] Web UI: display logs (using `BufferedLogger` / `LogBuffer`)
- [ ] Web UI: real-time updates (polling or WebSocket)

### Observability / Operations

- [ ] Structured log output (JSON) for production deployments
- [ ] Graceful shutdown (drain queue before exiting)
- [ ] Health-check endpoint (`GET /health`)
- [ ] Configurable max retry count per resource (currently hardcoded)

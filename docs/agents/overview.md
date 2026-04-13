# Application Overview

## What is Navi?

Navi is a **queue-based cache-warmer** written in Node.js, designed to run inside Docker.
It reads a YAML configuration file, discovers which HTTP resources can be requested
immediately (no parameters required), fires those requests concurrently, and chains the
responses into further parameterised requests — repeating until the entire resource graph
has been warmed.

An optional read-only **web monitoring interface** allows observing jobs and workers in
real time.

See [Runtime Flow](flow.md) for the detailed technical reference.

---

## Resource Chaining Concept

```
ResourceRequest (no params)           ← enqueued at startup
  → HTTP response
    → parse JSON → items[]
      → for each item × action:
          → map variables
            → enqueue ResourceRequestJob (with params)   ← TODO: not yet implemented
              → HTTP response → ...   (recursive)
```

Actions define how response fields are mapped to parameters for the next request via
`parameters`. Each value in the `parameters` map is a path expression (e.g. `parsedBody.id`,
`headers['page']`) resolved against a response wrapper that exposes the parsed JSON body and
HTTP headers. A resource with no actions is a leaf node and ends the chain.

---

## Implementation Checklist

### Core Engine

- [x] CLI entrypoint (`source/bin/navi.js`) with `ArgumentsParser`
- [x] Configuration loading from YAML (`ConfigLoader`, `ConfigParser`)
- [x] `Config` model — `ResourceRegistry`, `ClientRegistry`, `WorkersConfig`, `WebConfig`
- [x] `ResourceRequestCollector` — identifies parameter-free resources for initial enqueueing
- [x] Initial enqueueing of parameter-free `ResourceRequest`s at startup
- [x] `JobRegistry` singleton — queues: enqueued, processing, failed, retryQueue, finished, dead
- [x] `WorkersRegistry` singleton — idle/busy worker pool tracking
- [x] `WorkerFactory` — creates `Worker` instances with unique IDs
- [x] `Engine` loop with `WorkersAllocator`
- [x] `Worker` execution of `ResourceRequestJob` (HTTP via Axios)
- [x] Response parsing (`ResponseParser`) — raw JSON body → JS value
- [x] `ActionsEnqueuer` + `ActionEnqueuer` — (item × action) cross-product → `ActionProcessingJob` queue
- [x] `ActionProcessingJob` execution with `ParametersMapper`
- [x] Retry with cooldown for failed `ResourceRequestJob`s
- [x] Dead job tracking (jobs that exhaust retry allowance)

### Resource Chaining

- [ ] `ResourceRequestAction.execute()` should enqueue a new `ResourceRequestJob` with
      mapped parameters instead of only logging them

### Web Interface

- [x] Express `WebServer` with React SPA (served from `source/public/`)
- [x] `GET /stats.json` — aggregate counts for jobs and workers
- [ ] Web UI: list individual jobs per queue/state (URL, status, failure reason)
- [ ] Web UI: list individual workers with their current state and active job
- [ ] Web UI: display jobs in cooldown with time remaining until retry
- [ ] Web UI: display logs (`BufferedLogger` / `LogBuffer`)
- [ ] Web UI: real-time updates (polling or WebSocket)

### Observability / Operations

- [ ] Structured log output (JSON) for production deployments
- [ ] Graceful shutdown (drain queue before exiting)
- [ ] Health-check endpoint (`GET /health`)
- [ ] Configurable max retry count per resource (currently hardcoded)

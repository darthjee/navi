# Issue: Add Job and Worker Attributes When Publishing Logs

## Description

Logs sent to `LogRegistry` support structured attributes. When a log is produced inside a context tied to a specific worker and job (e.g. within `Client`, `ResourceRequestJob`, or similar), the log entry should automatically carry the worker ID and job ID as attributes, making it possible to correlate log entries with the work that triggered them.

## Problem

- Log calls in classes like `Client` are made without context — the emitted log has no information about which worker or job was active at the time.
- Consumers of the log API (e.g. the web UI) cannot filter or group log entries by job or worker without this data.
- Passing the worker/job IDs as raw attributes at each call site is error-prone and repetitive.

## Expected Behavior

- When a log is emitted inside a job-processing context, the resulting log entry includes `workerId` and `jobId` in its `attributes`.
- Classes that operate within such a context (e.g. `Client`) receive a **log context** object at construction/call time and delegate logging through it.
- The log context knows the relevant attributes and forwards the message plus attributes to `LogRegistry`.

## Solution

- Introduce a `LogContext` class (or similar) that wraps a set of fixed attributes (e.g. `{ workerId, jobId }`) and exposes `debug / info / warn / error` methods that merge those attributes into every call forwarded to `LogRegistry`.
- Update `Worker` (or the job execution path) to instantiate a `LogContext` and pass it down to objects that perform logging (`Client`, `ResourceRequestJob`, etc.).
- Replace direct `LogRegistry.*` / `Logger.*` calls in those objects with calls through the injected `LogContext`.

## Log call sites

### Needs job/worker context

These log calls happen during job processing and should carry `workerId` and `jobId`:

| File | Call | Notes |
|------|------|-------|
| `background/Worker.js` | `LogRegistry.error` | Job failure |
| `jobs/ResourceRequestJob.js` | `Logger.debug`, `LogRegistry.error` | Job start and failure |
| `jobs/AssetDownloadJob.js` | `Logger.debug`, `LogRegistry.error` | Job start and failure |
| `jobs/ActionProcessingJob.js` | `Logger.debug` | Job start |
| `jobs/HtmlParseJob.js` | `Logger.debug` | Job start |
| `models/ResourceRequestAction.js` | `LogRegistry.error` | Action skipped error |
| `services/Client.js` | `LogRegistry.info`, `LogRegistry.error` | All HTTP request/response logs |
| `utils/HtmlParser.js` | `LogRegistry.warn` | Called from `HtmlParseJob` |
| `utils/HtmlElementParser.js` | `LogRegistry.warn` | Called from `HtmlParseJob` |

### Does not need job/worker context

These log calls happen outside of job processing and should remain as-is:

| File | Call | Notes |
|------|------|-------|
| `services/Engine.js` | `Logger.debug` | Engine loop tick |
| `services/ConfigLoader.js` | `Logger.error` | Config loading |
| `services/FailureChecker.js` | `LogRegistry.error` | Post-run threshold check |
| `utils/EnvResolver.js` | `Logger.warn` | Environment variable resolution |
| `server/RouteRegister.js` | `Logger.debug` | HTTP route handling |
| `server/WebServer.js` | `Logger.info` | Server startup |

## Future API

Storing `workerId` and `jobId` as attributes on log entries enables a future `/logs.json` endpoint (or parameters on the existing one) to filter log entries by worker or by job, making it straightforward to trace exactly what happened during a specific job's lifecycle.

## Benefits

- Log entries become traceable back to the job and worker that produced them.
- No repetition of attribute-passing at individual call sites.
- Scales cleanly — new contextual attributes (e.g. `requestUrl`) can be added to `LogContext` in one place.
- Foundation for future per-job and per-worker log filtering in the API.

---
See issue for details: https://github.com/darthjee/navi/issues/478

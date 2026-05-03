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

## Benefits

- Log entries become traceable back to the job and worker that produced them.
- No repetition of attribute-passing at individual call sites.
- Scales cleanly — new contextual attributes (e.g. `requestUrl`) can be added to `LogContext` in one place.

---
See issue for details: https://github.com/darthjee/navi/issues/478

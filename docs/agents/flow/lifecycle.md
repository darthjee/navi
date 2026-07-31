# Engine Lifecycle States

| Status | Meaning |
|--------|---------|
| `running` | Engine loop is active and processing jobs. |
| `pausing` | Pause requested; waiting for active workers to finish. |
| `paused` | Engine loop stopped; jobs remain in queues. |
| `stopping` | Stop requested; waiting for active workers to finish. |
| `stopped` | Engine loop stopped; all job queues cleared. |

## Transitions

```
running  ──[PATCH /engine/pause]──►  pausing  ──[workers idle]──►  paused
running  ──[PATCH /engine/stop]───►  stopping ──[workers idle]──►  stopped
running  ──[PATCH /engine/restart]►  stopping ──[workers idle]──►  running
paused   ──[PATCH /engine/continue]──────────────────────────────►  running
stopped  ──[PATCH /engine/start]─────────────────────────────────►  running
```

Any call-site that enqueues a side-effect job checks `Application.isStopped()` before calling `JobRegistry.enqueue()`. If stopped, the enqueue is silently skipped.

When `web.autostart` is `false`, the application boots directly into `stopped` instead of `running` — see [Web Server](../web-server.md#engine-start-request-and-response) for the `PATCH /engine/start` request/response contract that resumes it (optionally naming which resources to enqueue).

When `web.idle_timeout` is configured, sustained idleness (`running` with no busy workers and no jobs in any queue) drives the same `running → stopped` shutdown transition as `PATCH /engine/shutdown` — the web server shuts down too and the process ends, exactly like CI mode exiting once its queue drains. See [Web Server](../web-server.md#configuration) for the countdown/reset semantics.

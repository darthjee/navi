# Issue: Add Server idle_timeout

## Description
Navi can run in two modes depending on whether the `web` config has a port:
- **CI mode** (no port): once all workers finish and the queue is empty, the application exits.
- **Web mode** (port configured): after workers finish, the web interface lingers indefinitely, allowing manual reset/interaction via the dashboard.

## Problem
In web mode, the process keeps running forever after work is done, even if nobody is using the dashboard. This wastes resources (memory, CPU, an open port) when the web server sits idle with no active jobs and no user interaction.

## Expected Behavior
When configured, the web server should shut itself down — the same way the application exits in CI mode — after sitting idle (no active jobs, no job activity) for a configurable amount of time. If not configured (or set to `0`), current behavior (linger forever) is preserved.

## Solution
Add an optional `idle_timeout` (in seconds) to the `web` config section:

```yaml
web:
  port: 3000
  idle_timeout: 900 # 15 minutes
```

- **Countdown starts** when the last worker finishes and the job queue is empty (regardless of whether any jobs ended in error).
- **Countdown resets** whenever a job changes status or a new job is enqueued.
- **On expiry**, the application shuts down exactly as it would in CI mode (web server included).
- **Disabled by default**: if `idle_timeout` is unset or `0`, behavior is unchanged — the web server lingers indefinitely.
- **Independent of `enable_shutdown`**: `enable_shutdown` only gates the manual shutdown button/endpoint; `idle_timeout` auto-shutdown applies regardless of that flag's value.

## Benefits
- Avoids unnecessary resource consumption (CPU, memory, open port) for idle web-mode deployments.
- Opt-in and backward-compatible: omitting the setting preserves today's behavior.

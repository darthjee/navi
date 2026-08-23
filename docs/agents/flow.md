# Runtime Flow

CLI entrypoint, config loading, the Engine allocation loop, job/action/asset processing, failure handling, and engine lifecycle states.

| Topic | Description |
|---|---|
| [Startup and Configuration](flow/startup-and-config.md) | The `navi.js` boot sequence, and the full `navi_config.yml` structure with path-expression rules. |
| [Engine and Workers](flow/engine-and-workers.md) | The allocation loop and how each `Worker` processes a job. |
| [Actions and Assets](flow/actions-and-assets.md) | How extraction/emit, actions, paginated actions, and asset (HTML/asset URL) processing enqueue follow-up jobs. |
| [Failure Handling](flow/failure-handling.md) | Retry/cooldown/dead-job flow and the `failure.threshold` exit-code check. |
| [Engine Lifecycle States](flow/lifecycle.md) | The `running`/`pausing`/`paused`/`stopping`/`stopped` states and their transitions. |

# Testing

[Engine Graceful Shutdown](../engine-shutdown.md)

Jasmine specs under `deku-swarm/spec/`, mirroring the `lib/` tree.

## `Engine` (#1009)

- drains successfully with `keepAlive: true` and resolves `true`;
- resolves `false` on timeout with a job still in `perform()`;
- resolves `true` immediately when the pool is already idle;
- leaves `#enqueued` / `#retryQueue` / `#failed` contents untouched after the call;
- does not promote a cooling-down job during the drain window;
- is idempotent when called twice (same result, single drain);
- resolves without throwing when called before `start()`;
- exits the loop and resolves `start()` while `#enqueued` / `#retryQueue` / `#failed` still hold jobs;
- resolves `start()` on timeout even with a job still in `perform()`.

## `Worker` (#1010, only if the [hook](idle-hook.md) ships)

- `onWorkerIdle` fires after `setIdle` on both the success and the failure path;
- an unset callback is a no-op.

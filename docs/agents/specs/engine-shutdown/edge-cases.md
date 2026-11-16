# Edge cases

[Engine Graceful Shutdown](../engine-shutdown.md)

Pinned behaviour of `shutdown({ timeoutMs })`:

| Case | Behaviour |
|---|---|
| Before `start()` | Resolves immediately with `true` if no worker is busy, `false` otherwise. Never throws and never starts the loop. |
| After the loop already exited | Same rule: `true` if the pool is idle, `false` otherwise. Idempotent. |
| Called twice | The second call joins the first and resolves with the same result. It does not throw and does not reset the timeout. |
| While `#stopped` is already set | Drains using the same rules; `stop()` state does not abort an in-progress drain. |
| `timeoutMs` omitted or `0` | Means "no wait": resolves immediately with the current pool state (`hasBusyWorker()` inverted). No implicit infinite wait. |
| `start()` rejected or never called | `shutdown()` still returns a defined boolean rather than hanging. |

# Plan: Engine: shutdown({ timeoutMs }) drain

Issue: [1009-engine-shutdown-timeoutms-drain.md](../../issues/1009-engine-shutdown-timeoutms-drain.md)

## Overview
Add `Engine.shutdown({ timeoutMs })` → `Promise<boolean>` to `deku-swarm`. It is a tick-granular drain that freezes promotion, allocation and idle tracking, waits for busy workers to finish, and lets `start()` resolve. The plan also corrects the `stop()` edge case in the engine-shutdown spec, resolves its granularity open question, and bumps the version. All the work falls to the deku-swarm specialist.

See [deku-swarm.md](deku-swarm.md) for the full plan.

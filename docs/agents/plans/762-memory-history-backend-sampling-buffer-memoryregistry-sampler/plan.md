# Plan: Memory history: backend sampling buffer (MemoryRegistry + sampler)

Issue: [762-memory-history-backend-sampling-buffer-memoryregistry-sampler.md](../../issues/762-memory-history-backend-sampling-buffer-memoryregistry-sampler.md)

## Overview

Wire Navi's currently-unused `source/lib/utils/memory/` ring buffer into a live feed:
add `interval` + `page_size` to `web.memory.data_store` (with `interval` validated), a
minimal four-method `MemoryRegistry` static-facade + instance built during config load,
and a `MemorySampler` (new `source/lib/services/memory/` folder) that `ServerController`
starts and stops — sampling process RSS on the configured interval into the buffer. The
`/memory/history.json` endpoint, its serializer, and all frontend work are out of scope
(later sub-issues of #761); this issue only delivers the `getEntries({ lastId })` API and
`dataStorePageSize` config they will consume.

All work falls inside `source/` — a single owner.

See [engine.md](engine.md) for the full plan.

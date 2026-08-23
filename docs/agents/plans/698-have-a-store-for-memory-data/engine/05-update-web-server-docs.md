# Document web.memory.data_store.size

Update the memory-config section of `docs/agents/web-server.md` to document the new `web.memory.data_store.size` key (default 100), next to the existing `maximum`/`thresholds` documentation, and note explicitly that the store exists but nothing populates or exposes it yet (no recording loop, no read endpoint) — this issue only adds the mechanism.

## Files to Change

- `docs/agents/web-server.md` — add `data_store.size` to the `web.memory` config documentation.

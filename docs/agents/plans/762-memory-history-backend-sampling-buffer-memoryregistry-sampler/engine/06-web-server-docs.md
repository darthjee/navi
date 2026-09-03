# web-server.md doc update

Update the agent-facing architecture doc `docs/agents/web-server.md` — the
`web.memory.data_store` section (around L304–318, the block after the `data_store:` YAML
example).

## What to do

- Document `data_store.interval` (seconds between RSS samples, default `5`) and
  `data_store.page_size` (max entries `/memory/history.json` returns, default `20`).
- Rewrite the existing paragraph that currently says the store is unpopulated
  ("As of this writing, nothing populates this store yet — there is no periodic
  RSS-polling loop and no read endpoint for it — this config key only sizes the buffer
  for a future issue to wire up.") to describe the new reality: a `MemorySampler` started
  by `ServerController` fills the buffer every `interval` seconds while the web server
  runs. Keep the note that the **read endpoint** (`/memory/history.json`) is still not
  present (that is a later sub-issue of #761).
- State the retained window ≈ `size × interval` (~8 min at defaults: 100 × 5 s).
- State that `data_store.*` is **boot-time only** — `EngineController.reload()` does not
  rebuild registries or restart `ServerController`, so a live config reload does not
  re-cadence the sampler (same as `log.size` / `emit.size`).
- Mention that `interval` is validated (`InvalidMemoryDataStore` on a non-finite or
  `<= 0` value) whereas `size` / `page_size` are taken raw.

## Files to Change

- `docs/agents/web-server.md` — `web.memory.data_store` section: new keys, rewritten
  "unpopulated" paragraph, retained-window note, boot-time-only note, validation note.

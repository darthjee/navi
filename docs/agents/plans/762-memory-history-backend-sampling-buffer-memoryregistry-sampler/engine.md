# Engine Plan: Memory history: backend sampling buffer (MemoryRegistry + sampler)

Main plan: [plan.md](plan.md)

Issue: [762-memory-history-backend-sampling-buffer-memoryregistry-sampler.md](../../issues/762-memory-history-backend-sampling-buffer-memoryregistry-sampler.md)

## Overview

Everything is in `source/`. The issue file is the source of truth for rationale and
edge-case decisions (Validation, Testing strategy, Alternatives considered, Acceptance
criteria) — these step files give the ordering, the file lists, and the per-step scope.

Step order follows the dependency chain: config first (everything reads `memoryConfig`),
then the registry (wraps the existing `MemoryDataStore`), then bootstrap wiring, then the
sampler, then its `ServerController` wiring, then the agent-facing doc.

## Steps

- [01 — data_store config keys + interval validation](engine/01-config-datastore-keys-and-validation.md)
- [02 — MemoryRegistry + MemoryRegistryInstance](engine/02-memory-registry.md)
- [03 — Registry bootstrap wiring + test cleanup](engine/03-registry-wiring-and-bootstrap.md)
- [04 — MemorySampler](engine/04-memory-sampler.md)
- [05 — ServerController sampler wiring](engine/05-servercontroller-sampler-wiring.md)
- [06 — web-server.md doc update](engine/06-web-server-docs.md)

## CI Checks

- `source`: `cd source && npm test` (CI job: `jasmine` — runs `npm run coverage`)
- `source`: `cd source && npm run lint` (CI job: `checks` — eslint over `lib spec`)
- `source`: `cd source && npm run check_docs` — JSDoc pedantic pass; relevant because
  steps 01/02/04 add new JSDoc-documented classes and members.

## Notes

- **No new top-level folder.** `source/lib/services/memory/` is nested under `source/`,
  owned by the `engine` agent. `docs/agents/web-server.md` (step 06) is an agent-facing
  architecture doc — outside the `docs` agent's `docs/guides/*` scope — so it stays with
  this change under `engine`.
- **`InvalidMemoryDataStore`** is a genuinely new exception file; mirror the existing
  `source/lib/exceptions/config/InvalidMemoryThresholds.js` (extends `AppError`, carries
  structured fields).
- **`jasmine.clock()` is off-limits** — the suite has no precedent. `MemorySampler` takes
  injectable `{ setInterval, clearInterval }` + `rssReader`; specs drive ticks by
  capturing the callback. See the issue's _Testing strategy_.
- **`ServerController` lives in `source/lib/services/engine/`** and is always constructed
  (even with no `web:` section — `#webServer` is then `null`). The sampler must be guarded
  on `webConfig`/`#webServer` presence, added via a `buildSampler` seam parallel to the
  existing overridable `buildWebServer`.
- **Ordering guarantee**: `ApplicationConfigurator.load()` (builds `MemoryRegistry`) always
  runs before `ServerController.start()` (starts the sampler). `MemoryRegistry.add`'s
  unbuilt no-op only needs to cover tests.
- `data_store.*` is boot-time only — `EngineController.reload()` does not rebuild
  registries or restart `ServerController`. Same as `log.size` / `emit.size`.

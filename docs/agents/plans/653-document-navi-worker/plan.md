# Plan: Document navi worker

Issue: [653-document-navi-worker.md](../issues/653-document-navi-worker.md)

## Overview

Write `docs/agents/worker.md`, a new architecture document describing the worker/job/engine subsystem (`source/lib/background/`, `source/lib/services/Engine.js`, `source/lib/services/WorkersAllocator.js`, and the collections in `source/lib/utils/collections/`) as a cohesive, potentially extractable unit — full interface docs for the core classes, an explicit generic-vs-Navi-specific coupling map, and extraction notes for the pieces that still need work before a standalone package split is possible. No source code changes; this is a documentation-only issue.

## Context

`docs/agents/flow/engine-and-workers.md` already documents the Engine loop and worker execution at a narrative, step-by-step level (see its "Engine Loop" and "Worker Execution" sections). What's missing is a class-by-class architectural reference: responsibilities, public interfaces, internal collections, and — the actual motivation for this issue — a clear line between what's generic enough to ship as a standalone package versus what's Navi-specific and stays behind.

During exploration, one detail in the issue was found to be stale and was corrected before writing this plan: the issue originally described `ApplicationInstance.enqueueFirstJobs()` as logic that "should be extracted" into a dedicated Navi class. That extraction has already happened — `enqueueFirstJobs()` now just delegates to `new ResourceEnqueuer().enqueueAll()` (`source/lib/utils/ResourceEnqueuer.js`), which is already the dedicated Navi-specific class calling `JobRegistry.enqueue()` from outside the worker subsystem. The issue file and its GitHub counterpart have been updated to reflect this — document `ResourceEnqueuer` as already-extracted, not as a TODO.

Repo convention: index docs (`architecture.md`, `flow.md`) hold a table linking to sub-files under `architecture/` and `flow/` respectively. `worker.md` follows the same evolvable shape — starts as a single file, and only splits into `docs/agents/worker/*.md` (with `worker.md` becoming the index) if it grows too large. No CI job lints markdown in this repo (`.circleci/config.yml` only runs `npm run lint` per JS package), so no `## CI Checks` section applies.

## Implementation Steps

### Step 1 — Write `docs/agents/worker.md`

Author the document covering, in order:

1. **Overview** — one short paragraph framing the worker/job/engine subsystem as a unit and stating the extraction motivation (mirrors the issue's Description).
2. **Core classes** — one subsection per class with a full interface description, using the issue's table as source material but written in prose/reference form consistent with this repo's other architecture docs (e.g. `docs/agents/architecture/source-layout.md`): `Worker`, `WorkerFactory`, `WorkersRegistry`/`WorkersRegistryInstance`, `Job` (abstract base), `JobFactory`, `JobRegistry`/`JobRegistryInstance`, `Engine`, `WorkersAllocator`.
3. **Collections** — `IdentifyableCollection`, `Queue`, `SortedCollection`: what each stores, which registry field uses it, and the operations it exposes.
4. **Engine auxiliary services** — `EngineEvents`, `EngineStopService`, `FailureChecker`, `RunSummary`: what each does today, plus the extraction note that the Engine should support a generic injectable listener mechanism so these can be attached by Navi without belonging to the worker package.
5. **`ResourceEnqueuer`** — describe it as the already-extracted Navi-specific class that discovers parameter-free `ResourceRequest`s (via `ResourceRequestCollector`) and enqueues them with `JobRegistry.enqueue('ResourceRequestJob', ...)` from outside the worker package; note it also backs the by-name `enqueue(names)` path used by the web API. No further extraction needed for this piece.
6. **Job subclasses (list only)** — `ResourceRequestJob`, `ActionProcessingJob`, `PaginatedActionProcessingJob`, `HtmlParseJob`, `AssetDownloadJob`, each with its factory key and `maxRetries`, explicitly marked as Navi-specific (stay behind on extraction). Do not detail their `perform()` internals.
7. **Job factory registration table** — sourced from `ApplicationInstance.#initRegistries()` (`source/lib/services/ApplicationInstance.js`): factory key, class, and injected attributes:
   - `'ResourceRequestJob'` → `ResourceRequestJob` (default klass) — `{ clients: config.namespaceMap }`
   - `'Action'` → `ActionProcessingJob` — no injected attributes
   - `'PaginatedAction'` → `PaginatedActionProcessingJob` — no injected attributes
   - `'HtmlParse'` → `HtmlParseJob` — `{ jobRegistry: JobRegistry, clientRegistry: config.namespaceMap }`
   - `'AssetDownload'` → `AssetDownloadJob` — `{ clientRegistry: config.namespaceMap }`
8. **Out of scope note** — state explicitly that the web server/monitoring UI/frontend/HTTP routes and the generic `Factory` base class are not documented here.
9. **Coupling map for extraction** — a "Generic (goes with the package)" list, a "Navi-specific (stays in Navi)" list (including `ResourceEnqueuer` as already-extracted and `ApplicationInstance` as the boot orchestrator), and a "Current coupling via static singletons" list naming exactly which classes depend on `JobRegistry`/`WorkersRegistry` as static singletons and noting that extraction requires refactoring those to injectable instances — reuse the issue's coupling map as source content.

If, once drafted, the file is too large for comfortable single-file reading, split it into `docs/agents/worker/*.md` with `worker.md` becoming an index table (same shape as `architecture.md`/`flow.md`), rather than forcing everything into one file.

### Step 2 — Cross-link the new document

- Add a row for `worker.md` (or the `worker/` index, if split) to the `## Documentation` table in `AGENTS.md`, following the existing row shape (`| [Name](path) | One-line description. |`).
- Add a link from `docs/agents/flow/engine-and-workers.md` to the new document — e.g. a short pointer near the top ("See [Worker Subsystem](../worker.md) for the class-by-class architectural reference and the extraction coupling map.") — without duplicating content already covered there.

## Files to Change

- `docs/agents/worker.md` (new) — the worker subsystem architecture document (or `docs/agents/worker/*.md` + index, if split)
- `AGENTS.md` — new row in the `## Documentation` table
- `docs/agents/flow/engine-and-workers.md` — link to the new document

## Notes

- Documentation only — no `source/` code changes, no tests to run or update.
- Keep the "Navi-specific" and "Generic" classifications exactly as scoped in the issue; this document is a snapshot of the current architecture, not a proposal to implement the extraction itself.
- Double-check any method/field names transcribed from the issue against the actual source files while writing, the same way the discuss/plan phase did — the issue was already spot-checked for accuracy except for the `enqueueFirstJobs()`/`ResourceEnqueuer` discrepancy, which has been corrected.

# Plan: Spec: write the graceful-shutdown spec

Issue: [1008-spec-write-the-graceful-shutdown-spec.md](../../issues/1008-spec-write-the-graceful-shutdown-spec.md)

## Overview
Write the graceful-shutdown design from Epic #1004 (`Engine.shutdown({ timeoutMs })` in `deku-swarm`) as a temporary spec. It is a hub `docs/agents/specs/engine-shutdown.md` plus eight topic files under `docs/agents/specs/engine-shutdown/`, registered in the `docs/agents/specs.md` table. Docs-only: no code, README or guide changes.

## Context
- The specs lifecycle in `docs/agents/specs.md` requires planned work to be written as a temporary spec. Each topic gets one file, a large spec becomes a hub + subfolder, and the hub table links only the hub. The spec is removed once the work is folded into permanent docs (#1011).
- `docs/agents/specs/crawler.md` + `docs/agents/specs/crawler/` is the precedent. It has a one-paragraph intro, then a `| Topic | Description |` table linking each subfile.
- The design source is the body of #1004 (Proposal, Semantics, Loop exit, Idle detection, Scope, Expected, Design decisions, Edge cases, Implementation notes, Testing). It is restated in #1008's Solution section, together with the versioning and open-questions decisions.
- Current code referenced by the spec: `deku-swarm/lib/services/Engine.js` (`#keepAlive`, `stop()`, `start()` loop with `while (!this.#stopped && this.#shouldContinue())`, `#shouldContinue()`), `deku-swarm/lib/services/WorkersAllocator.js` (`_allocateNext()` fire-and-forget), `Worker#perform()` (`finally` → `setIdle`), `WorkerFactory#build()`, `WorkersRegistryInstance`'s default factory. `deku-swarm` is at `1.12.0`.

## Steps

- [01 — Write the spec hub](plan/01-write-the-spec-hub.md)
- [02 — Write the topic files](plan/02-write-the-topic-files.md)
- [03 — Register the spec in specs.md](plan/03-register-the-spec.md)

## Notes
- Describe planned behaviour in the future tense ("`shutdown()` will…") or as design statements, never as if it already exists, so readers don't confuse the spec with current behaviour.
- Cross-link the sub-issues (#1009, #1010, #1011) where a topic is owned by one of them, and link the Epic #1004 from the hub.
- Keep the spec faithful to #1004's decisions. Do not settle the items in `open-questions.md`; those belong to their owning sub-issues.
- No CI job validates `docs/agents/` content. Check every relative link by hand.

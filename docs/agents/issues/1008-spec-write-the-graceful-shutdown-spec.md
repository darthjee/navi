# Issue: Spec: write the graceful-shutdown spec

## Description
Write the design of Epic #1004 — a graceful drain for the `deku-swarm` `Engine`, `await engine.shutdown({ timeoutMs })` → `true | false` — as a temporary spec under `docs/agents/specs/`, following the specs lifecycle in `docs/agents/specs.md`. This is the first sub-issue of the Epic: the spec becomes the single source of truth for the implementation sub-issues (#1009 `Engine.shutdown()`, #1010 `onWorkerIdle` hook) and for the docs fold-in (#1011). Responsible agent: architect. Docs-only — no code changes.

## Problem
Today `Engine.stop()` only sets a flag, `start()` holds no reference to in-flight `Worker.perform()` promises, and with `keepAlive: true` the loop never ends on its own — so hosts (e.g. darthjee/kerghan#479) hand-roll "poll `hasBusyWorker()`, then `stop()`". The design to fix this lives only in the body of #1004; the specs lifecycle requires it to be written down as a spec before implementation starts.

## Expected Behavior
- `docs/agents/specs/engine-shutdown.md` (hub) plus `docs/agents/specs/engine-shutdown/*.md` topic files capture every decision from #1004.
- The spec records the minor-bump decision and has an open-questions topic file.
- `docs/agents/specs.md` lists the new spec in its table (hub link only, never subfiles).
- No code, README or guide changes — those belong to #1009–#1011.

## Solution
Create a hub + subfolder spec, following the `specs/crawler.md` / `specs/crawler/` pattern. The hub gives a short overview of `shutdown()` and lists the topic files:

- **`semantics.md`** — `#draining` state; `keepAlive` stays immutable; promotion, allocation and idle-timeout tracking frozen during drain; wait until no worker is busy or `timeoutMs` elapses; boolean result; no cancellation of in-flight `perform()`; queued jobs (`#enqueued`, `#retryQueue`, `#failed`) untouched; cooling-down jobs not promoted (intended).
- **`loop-exit.md`** — the explicit drain branch in `#shouldContinue()` (`hasBusyWorker() && !#drainTimedOut`), why clearing `keepAlive` is not enough (queued jobs keep `hasJob()` true), `start()` resolving on timeout with work in flight, the unchanged `!#stopped` guard.
- **`edge-cases.md`** — before `start()`, after the loop exited, called twice (joins the first call, timeout not reset), while `#stopped` is set, `timeoutMs` omitted or `0` (no wait), `shutdown()` never hanging if `start()` is rejected or never called.
- **`idle-hook.md`** — optional `onWorkerIdle` no-payload callback: fourth `Worker` constructor attribute, forwarded by `WorkerFactory#build()`, invoked in `perform()`'s `finally` right after `setIdle`, safe no-op when unset (including `WorkersRegistryInstance`'s default factory).
- **`testing.md`** — the Jasmine cases listed in #1004, for `Engine` and (if the hook ships) `Worker`.
- **`out-of-scope.md`** — flush mode, `drain`/`drained` events, Navi `EngineController` adoption, cooperative cancellation of `Job.perform()`.
- **`versioning.md`** — the change is additive (no breaking change), so `deku-swarm` gets a **minor** bump (`1.12.0` → `1.13.0`), done in #1009 with `bump_version.sh` (see `docs/agents/release.md`). #1010 adds no further bump if it lands before that version is released; otherwise it takes its own minor bump.
- **`open-questions.md`** — items left for later sub-issues to settle, each tagged with its owner, e.g.:
  - drain-observation granularity with `sleepMs` polling, and whether it is acceptable without the hook (#1009);
  - how `Engine` wires `onWorkerIdle` into `WorkerFactory` and wakes the loop on it (#1010);
  - exact README/guide placement of the new API and its caveats (#1011).

  Each sub-issue updates this file as it resolves its items.

Then add the spec's row to the table in `docs/agents/specs.md`.

## Benefits
- A single, reviewable source of truth for #1009–#1011, so each implementation sub-issue refines its own open topics against the spec instead of re-reading the Epic.
- Follows the project's specs lifecycle, so the design is cleanly folded into permanent docs and removed once shipped (#1011).

# Architect Plan: Inject a status provider into EngineStopService instead of the static Application facade

Main plan: [plan.md](plan.md)

## Shared contracts

Relies on `engine`'s final shape for `EngineStopService`: it stays at `source/lib/services/engine/EngineStopService.js` and now takes an injectable `statusProvider` (defaulting to `Application`) instead of reaching into `Application` directly — that's the "done" state this doc update describes.

## Implementation Steps

### Step 1 — Correct docs/agents/worker.md's Engine auxiliary services section

In the "Engine auxiliary services (Navi-specific)" section:
- In the intro paragraph, change "`EngineStopService` is the remaining holdout that still reaches into `Application`/`JobRegistry` directly rather than through the listener API — tracked separately in [#728]..." to drop the inaccurate `JobRegistry` mention (the code only ever touched `Application`) and reflect that #728 is now resolved rather than "remaining"/"tracked separately" (phrase it to match how `FailureChecker`/`RunSummary` are described as done just below, in the same table).
- In the `EngineStopService` table row: correct the `File` column from `source/lib/services/EngineStopService.js` to `source/lib/services/engine/EngineStopService.js`, and update the `Extraction note` column to describe the injectable `statusProvider` default parameter as done, matching the "Done — ..." phrasing used in the `FailureChecker`/`RunSummary` rows.

## Files to Change

- `docs/agents/worker.md` — fix the stale path, the injectable-provider note, and the inaccurate "JobRegistry" mention in the "Engine auxiliary services" section.

## Notes

- Wait for `engine`'s Step 1 (or at least confirm the final method signature) before finalizing the exact wording of the "done" note, so the doc describes the shape that actually shipped.

# Plan: Add a new restart type

Issue: [645-add-a-new-restart-type.md](../../issues/645-add-a-new-restart-type.md)

## Overview

Add a new `PATCH /engine/reload` endpoint and a "Reload" frontend button, entirely additive: the existing `PATCH /engine/restart` endpoint and button are left untouched, since (once #612 lands) their current stop+start-against-live-namespace behavior already is what "Restart" should mean. "Reload" additionally re-reads the on-disk config file(s) and merges them into the live `NamespaceMap` before cycling the engine, reusing `NamespaceMap.include()` — the same merge machinery `POST /api/config` already relies on — so nothing added via the API is lost.

## Agents involved

- [engine](engine.md)
- [frontend](frontend.md)

## Shared contracts

**`PATCH /engine/reload`** — new endpoint, mirrors `PATCH /engine/restart` exactly in shape:

- No request body.
- Success: `200` with JSON body `{ "status": "stopping" }`.
- Failure: `409 Conflict` (via the existing `ConflictError` handler-error pattern) when the engine is not currently running.
- No `/api/engine/reload` counterpart is added — consistent with the existing pattern where `/engine/restart`, `/engine/pause`, `/engine/continue`, and `/engine/shutdown` are frontend-only, and only `/engine/start`/`/engine/stop` have token-secured `/api/engine/*` equivalents.

The frontend's button-visibility rule for "Reload" must match "Restart" exactly (`isRunning() || isPaused()`), even though the backend only actually accepts the request while `running` — this is the same pre-existing quirk `/engine/restart` already has (button visible while paused, but a click while paused 409s), and Reload should behave identically rather than introduce a new, inconsistent rule.

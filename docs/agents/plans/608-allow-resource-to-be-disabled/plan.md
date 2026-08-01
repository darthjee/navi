# Plan: Allow resource to be disabled

Issue: [608-allow-resource-to-be-disabled.md](../../issues/608-allow-resource-to-be-disabled.md)

## Overview

Add two new optional boolean attributes, `enabled` and `disabled`, to individual `ResourceRequest` entries (each array item under a `resources.<name>` key). A request is considered disabled when `disabled: true` (which always wins over any `enabled` value) or `enabled: false`. A disabled request must never be enqueued, through any of the three existing enqueue paths: automatic startup, manual/API trigger by resource name, and chained `actions`/`paginated_actions`.

## Context

Today there is no way to toggle a configured resource request off without deleting its YAML block. This issue adds `enabled`/`disabled` keywords so a request can be turned off in place. The granularity is per-`ResourceRequest` entry (one array item), not per-resource-name group — the same granularity `url`/`status`/`client` already use.

## Implementation Steps

### Step 1 — Parse `enabled`/`disabled` on `ResourceRequest`

In `source/lib/models/request/ResourceRequest.js`, add `enabled` and `disabled` to the constructor's destructured attributes (both optional booleans) and expose a single derived getter, e.g. `disabled()`, where:
- `disabled: true` → disabled, regardless of `enabled`.
- Otherwise `enabled === false` → disabled.
- Otherwise → enabled (today's default, unchanged).

Keep the raw YAML keys (`enabled`/`disabled`) as constructor input but resolve them to one internal boolean so every call site only needs to check one thing.

### Step 2 — Skip disabled requests at startup (per-entry filter)

In `source/lib/utils/ResourceRequestCollector.js`, `requestsNeedingNoParams()` (and, if warranted, `allRequests()` — decide based on whether any other caller of `allRequests()` should also see disabled requests excluded) should exclude requests where `resourceRequest.disabled` is true. This automatically fixes `ApplicationInstance.enqueueFirstJobs()`, since it consumes `requestsNeedingNoParams()`.

### Step 3 — Skip disabled requests on manual/API trigger by name (whole-name atomic skip)

`source/lib/utils/ResourceEnqueuer.js` already treats a named resource atomically: if *any* of its requests needs params, the *whole* named resource is skipped with reason `needs_params` (never partially enqueued — see `docs/agents/web-server.md`'s "never partially enqueued" note). Mirror that exact pattern for disabled: add a check `resource.resourceRequests.some((request) => request.disabled)` before the `needs_params` check (or combined with it), pushing `{ name, reason: 'disabled' }` to `skippedResources` and skipping the whole name, consistent with the existing atomicity convention for this path.

### Step 4 — Skip disabled requests when reached via chaining

Both `source/lib/models/request/ResourceRequestAction.js` (`execute()`) and `source/lib/models/request/ResourceRequestPaginatedAction.js` (`execute()`) currently do `for (const resourceRequest of resource.resourceRequests) { jobRegistry.enqueue(...) }` with no filtering at all. Add a `.filter((resourceRequest) => !resourceRequest.disabled)` (or equivalent) before enqueuing in both, so a disabled request can't be reached indirectly as the target of another (enabled) resource's action/paginated_action.

### Step 5 — Update documentation

- `docs/HOW_TO_USE_NAVI.md` — add `enabled`/`disabled` rows to the field reference table (near the existing `client`/`status` rows around line 100), and show `disabled: true` on one sample resource request in the schema example (around lines 58–82).
- `docs/agents/flow/startup-and-config.md` — note that disabled resource requests are excluded from the configuration structure example / startup flow (mirroring the same YAML example update).
- `docs/agents/web-server.md` — extend the existing `skippedResources` reason list (`not_found`, `needs_params`) to include `disabled`, next to the "never partially enqueued" note already there.

## Files to Change

- `source/lib/models/request/ResourceRequest.js` — parse `enabled`/`disabled`, expose derived `disabled` getter.
- `source/lib/utils/ResourceRequestCollector.js` — exclude disabled requests from `requestsNeedingNoParams()`.
- `source/lib/utils/ResourceEnqueuer.js` — add `disabled` as a third whole-name skip reason, alongside `not_found`/`needs_params`.
- `source/lib/models/request/ResourceRequestAction.js` — filter out disabled requests before enqueuing.
- `source/lib/models/request/ResourceRequestPaginatedAction.js` — filter out disabled requests before enqueuing.
- `source/spec/lib/models/request/ResourceRequest_spec.js` — cover `enabled`/`disabled` parsing and precedence (including the `enabled: true, disabled: true` conflict case).
- `source/spec/lib/utils/ResourceRequestCollector_spec.js` — cover disabled requests being excluded from `requestsNeedingNoParams()`.
- `source/spec/lib/utils/ResourceEnqueuer_spec.js` — cover the new `disabled` skip reason.
- `source/spec/lib/models/request/ResourceRequestAction_spec.js` — cover disabled target requests being skipped during chaining.
- `source/spec/lib/models/request/ResourceRequestPaginatedAction_spec.js` — cover disabled target requests being skipped during paginated chaining.
- `source/spec/support/factories/ResourceRequestFactory.js` — extend to optionally build with `enabled`/`disabled`, if the existing factory shape requires it for the new specs.
- `docs/HOW_TO_USE_NAVI.md`, `docs/agents/flow/startup-and-config.md`, `docs/agents/web-server.md` — documentation updates described in Step 5.

## CI Checks

- `source`: `yarn lint` (CI job: lint) and `npm run coverage` / `yarn test` (CI job: coverage/tests)

## Notes

- Only `source/` (engine scope) is touched by this issue; no `dev/` or `frontend/` changes are needed — nothing in `frontend/src` renders `skippedResources` reasons or per-resource enable state today.
- The whole-name atomic skip in Step 3 is intentionally coarser-grained than the per-entry filtering in Steps 2 and 4 — this mirrors the pre-existing `needs_params` behavior for the same on-demand-by-name path, not a new inconsistency introduced by this issue.
- No config-loading validation error is introduced for the `enabled: true, disabled: true` conflict case — `disabled: true` silently wins, per the issue's resolved conflict rule.

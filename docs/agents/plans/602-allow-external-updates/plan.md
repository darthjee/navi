# Plan: Allow external updates

Issue: [602-allow-external-updates.md](../../issues/602-allow-external-updates.md)

## Overview

Add a token-secured `/api` route namespace with three endpoints — `POST /api/config`, `POST /api/engine/start`, `POST /api/engine/stop` — so external systems can push new resource/client config into a running instance and control engine start/stop, without a restart. This builds directly on the runtime-merge machinery `#601`/`#613` already added (`NamespaceMap.include()`, `NamespaceMapBuilder`'s existing-namespace merge), so no new config-parsing logic is needed — only a new secured HTTP surface around it, plus generalizing resource enqueueing to be namespace-aware (today it's hardcoded to `default`).

## Context

Full contract (payload shapes, examples, security, merge/persistence semantics) is in the issue file. Key implementation-relevant facts already confirmed there:

- One namespace per `/api/config` payload; unknown namespaces are created on the fly; name clashes replace the existing resource/client.
- Auto-enqueue of param-free added/updated resources only when the engine is running.
- `/api/engine/start` payload: `{ "targets": [{ "namespace": "...", "resources": [...] }] }`, `resources` optional per target (omitted ⇒ all param-free resources in that namespace); omitting `targets` falls back to today's default-namespace behavior.
- `/api/engine/stop` is identical to `PATCH /engine/stop` (no body).
- All three share one token check against `web.api.token`, via a reusable secured-handler base class (more `/api/*` endpoints are expected later).
- Config changes are in-memory only (not persisted/included on restart).

## Implementation Steps

### Step 1 — `web.api.token` config

Extend `WebConfig` (`source/lib/models/configs/WebConfig.js`) to read a nested `api: { token }` section and expose it (e.g. `this.apiToken`). Value arrives already env-resolved, same as every other config field — `ConfigIncluder` runs `EnvStringResolver.resolve()` over the raw YAML text before parsing, so `web.api.token: $NAVI_API_TOKEN` needs no special-casing.

### Step 2 — `RouteRegister#registerPost`

Add a `registerPost` method to `source/lib/server/RouteRegister.js`, mirroring the existing `registerPatch` (async handler, same try/catch → `#handleError` mapping). Do not add a new generic error→4xx mapping here — see Step 6 for how payload validation errors are handled locally in the handler, following the existing `LogsHandler` precedent of a handler responding `res.status(400).json(...)` directly rather than a new `AppError` subclass.

### Step 3 — `SecuredRequestHandler` base class

Add `source/lib/common/server/SecuredRequestHandler.js`, extending `RequestHandler`. Constructor takes `(request, response, token)`. Its `handle()` checks the request's bearer token against the configured `token` — mismatch or missing config token throws the existing `ForbiddenError` (→ 403 via `RouteRegister`) — then delegates to a `process()` template method that concrete subclasses implement instead of `handle()`. This is the reusable piece the issue calls out for future `/api/*` endpoints.

### Step 4 — Namespace-aware resource enqueueing

Generalize `source/lib/utils/ResourceEnqueuer.js` to accept an explicit namespace (defaulting to `'default'`) instead of hardcoding `DEFAULT_NAMESPACE`, so named resources can be enqueued from any namespace. Also add (or extend an existing helper) a way to enqueue *every* param-free resource within an arbitrary namespace — same idea as `ApplicationInstance#enqueueFirstJobs`'s `ResourceRequestCollector(this.config.resourceRegistry).requestsNeedingNoParams()`, but sourced from `NamespaceMap.getNamespace(name).resourceRegistry` instead of the boot-time default. Both new `/api` handlers below depend on this.

### Step 5 — `POST /api/config` handler

Add `source/lib/server/handlers/api/ApiConfigHandler.js`, extending `SecuredRequestHandler`:

- Validate `req.body.namespace` is a non-empty string; 400 otherwise.
- Normalize `resources`/`clients` to `{}` when omitted **before** calling the merge — `NamespaceMapBuilder` treats a single-entry `files` array as strict, requiring both keys to be present (even if empty); defaulting them here lets the payload omit either key without tripping `MissingResourceConfig`/`MissingClientsConfig`.
- Call `NamespaceMap.include([{ namespace, resources, clients }])` (the singleton facade `#613` already added — it merges/creates the namespace and mutates the singleton in place, so existing `JobFactory` references stay valid with no extra rewiring needed).
- Catch config/registry validation errors thrown by the merge (`MissingResourceConfig`, `MissingClientsConfig`, `ResourceNotFound`, `ClientNotFound`, `NamespaceNotFound`, or a malformed-payload shape error) and respond 400 with the error message, instead of letting them fall through to `RouteRegister`'s generic 500.
- On success, if `Application.isRunning()`, enqueue only the param-free resources named in `resources` within the target namespace (Step 4's namespace-aware enqueuer) — not the whole namespace's registry.
- Respond `{ status: 'accepted' }`.

### Step 6 — `POST /api/engine/start` handler

Add `source/lib/server/handlers/api/ApiEngineStartHandler.js`, extending `SecuredRequestHandler`. Mirror `EngineStartHandler`'s state logic (stopped → `Application.start()`; running → enqueue; paused/pausing/stopping → `ConflictError`/409), but resolve what to enqueue from `req.body.targets` (array of `{ namespace, resources? }`) via Step 4's namespace-aware enqueuer, falling back to today's top-level `resources` / default-namespace behavior when `targets` is omitted. Aggregate the per-target `enqueued`/`skippedResources` results in the response, keeping the same response shape `PATCH /engine/start` already uses.

### Step 7 — `POST /api/engine/stop` handler

Add `source/lib/server/handlers/api/ApiEngineStopHandler.js`, extending `SecuredRequestHandler`, with the same body `EngineStopHandler` already has (`ConflictError` if not running, `Application.stop()`, respond `{ status: 'stopping' }`). Consider extracting the shared logic into a small helper both the PATCH and POST/api handlers call, to avoid duplicating it verbatim.

### Step 8 — Wire the routes

In `source/lib/server/Router.js`, add a `POST_ROUTES` map (registered via `register.registerPost`) for `/api/config`, `/api/engine/start`, `/api/engine/stop`, each constructed with `this.#webConfig.apiToken` as the extra `HandlerConfig` parameter. If `web.api.token` isn't configured, the token check in Step 3 never matches any provided value, so requests are always rejected — this is the intended safe default, not a bug to special-case.

### Step 9 — Tests and docs

Add/extend Jasmine specs (mirroring `source/spec/` layout) for: `WebConfig`'s new field, `RouteRegister#registerPost`, `SecuredRequestHandler`, the namespace-aware `ResourceEnqueuer` change, and all three new handlers (success, auth failure, validation failure, conflict paths). Update `docs/agents/web-server.md`'s routes table with the new `/api/*` endpoints and their request/response shapes (same style as the existing `/engine/start` documentation there).

## Files to Change

- `source/lib/models/configs/WebConfig.js` — parse `web.api.token`.
- `source/lib/server/RouteRegister.js` — add `registerPost`.
- `source/lib/common/server/SecuredRequestHandler.js` — new base class.
- `source/lib/utils/ResourceEnqueuer.js` — accept an explicit namespace.
- `source/lib/server/handlers/api/ApiConfigHandler.js` — new.
- `source/lib/server/handlers/api/ApiEngineStartHandler.js` — new.
- `source/lib/server/handlers/api/ApiEngineStopHandler.js` — new.
- `source/lib/server/Router.js` — mount the new `POST_ROUTES` under `/api/*`.
- `docs/agents/web-server.md` — document the new routes.
- Corresponding spec files under `source/spec/lib/...` for every file above.

## CI Checks

- `source`: `yarn test` (CI job: `jasmine`)
- `source`: `yarn lint` (CI job: `checks`)

## Notes

- Exact success status code (200 vs 202) and the token header scheme (`Authorization: Bearer` vs a custom header) were explicitly left open by the issue — default to `Authorization: Bearer` + 200 unless the implementing agent finds a stronger convention already in the codebase.
- `NamespaceMap.include()` and namespace-merge/replace semantics already exist (from `#601`/`#613`) — this plan only adds the HTTP surface and namespace-scoped enqueueing around them, not new config-merge logic.
- Whether `/api/engine/start`/`/api/engine/stop` should internally delegate to the existing `EngineStartHandler`/`EngineStopHandler` classes (vs. duplicating their bodies) is left to the implementing agent's judgment — Step 7 flags it as worth avoiding duplication where reasonable.

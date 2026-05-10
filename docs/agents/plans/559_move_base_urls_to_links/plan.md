# Plan: Move BaseURLs to Links

## Overview

Consolidate the two link-related API endpoints (`/links.json` and `/clients/base_urls.json`) into a single `/links.json` endpoint that returns both the configured shared links and one entry per client derived from its `base_url`. Remove the now-redundant `base_urls` endpoint, its backend handler, and all frontend components that exist solely to consume it.

## Context

- `GET /links.json` — returns links defined under `web.links` in the YAML config.
- `GET /clients/base_urls.json` — returns the `base_url` of each client.
- A new optional `linkText` field per client in the YAML config allows a human-readable label; if absent, the client key is used as the display text.
- The merge must happen at request time (not boot time) to avoid unnecessary memory overhead.

## Implementation Steps

### Step 1 — Add `linkText` to client config model

Extend the client config model (in `source/lib/models/configs/`) to read and expose an optional `linkText` field from the YAML config. If not provided, it defaults to `null` (the handler will fall back to the client key).

### Step 2 — Update the links endpoint handler

Modify the handler responsible for `GET /links.json` (in `source/lib/server/handlers/`) to also iterate over all clients in `ClientRegistry`, building one link entry per client:

```json
{ "url": "<client.base_url>", "text": "<client.linkText ?? clientKey>" }
```

Append these entries to the existing `web.links` list before responding. This computation happens inside the request handler, not at application boot.

### Step 3 — Remove `BaseUrlsRequestHandler` and its route

- Delete `source/lib/server/handlers/BaseUrlsRequestHandler.js` and its spec.
- Remove the `GET /clients/base_urls.json` route registration from `source/lib/server/Router.js`.

### Step 4 — Remove frontend `base_urls` components

- Identify and delete React components in `frontend/` that exist exclusively to fetch and display `base_urls` data.
- Remove the corresponding API client call for `GET /clients/base_urls.json`.
- Ensure the links section of the UI now uses data from `GET /links.json` only.

### Step 5 — Update documentation

- Update `docs/agents/web-server.md` to remove the `base_urls` route and document the updated `/links.json` response shape.
- Update `docs/agents/flow.md` or config docs to document the new optional `linkText` field per client.

## Files to Change

- `source/lib/models/configs/<ClientConfig>.js` — add optional `linkText` field
- `source/lib/server/handlers/<LinksRequestHandler>.js` — merge client base URLs into links response
- `source/lib/server/handlers/BaseUrlsRequestHandler.js` — **delete**
- `source/lib/server/Router.js` — remove `base_urls` route
- `source/spec/lib/server/handlers/BaseUrlsRequestHandler_spec.js` — **delete**
- `source/spec/lib/models/configs/<ClientConfig>_spec.js` — add `linkText` tests
- `source/spec/lib/server/handlers/<LinksRequestHandler>_spec.js` — add merged response tests
- `frontend/src/` — remove `base_urls` API client and components
- `docs/agents/web-server.md` — remove `base_urls` route, document updated links shape
- `docs/agents/` (config/flow docs) — document `linkText` field

## Notes

- Exact file names for the client config model and links handler are not confirmed yet — need to inspect the codebase.
- The frontend component tree for `base_urls` is not yet known — needs exploration.
- The fallback label (client key vs. some other default) should be confirmed with the user.
- Each step should be its own atomic commit (implementation + tests together).

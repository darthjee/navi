# Issue: Move BaseURLs to Links

## Description

Currently the API exposes two separate endpoints for links: `GET /links.json` (for shared links defined via `web.links` in config) and `GET /clients/base_urls.json` (for the base URLs of all defined clients). The goal is to consolidate these by folding the client base URLs directly into the links endpoint, then removing the now-redundant `base_urls` endpoint and its supporting code.

## Problem

- There are two separate link-related API endpoints (`/links.json` and `/clients/base_urls.json`) that serve related but split data.
- The split requires dedicated backend classes and frontend components solely to handle `base_urls`, which are not reused elsewhere.
- Maintaining two endpoints increases complexity in both the backend and the frontend.

## Expected Behavior

- Clients may declare an optional `linkText` field alongside `base_url` in the YAML config.
- `GET /links.json` returns all configured `web.links` **plus** one entry per client derived from its `base_url` (and `linkText` if present, falling back to the client key as display text).
- Example: a client named `default` with `base_url: http://remote_host:80` and `linkText: Default Domain` contributes `{ "url": "http://remote_host:80", "text": "Default Domain" }` to the links array.
- `GET /clients/base_urls.json` and all classes/components dedicated exclusively to it are removed.

## Solution

- Compute the client-derived links at request time in the `/links.json` endpoint handler (not at boot time, to avoid unnecessary memory overhead).
- Remove the `base_urls` endpoint route and all backend classes that are not shared with other functionality.
- Remove the frontend components that were used only to display the `base_urls` data.
- Update `docs/agents` to reflect the removed endpoint and the new `linkText` config field.

## Benefits

- Single, unified links endpoint simplifies both backend and frontend.
- Less code to maintain: dedicated `base_urls` classes and components are deleted.
- Cleaner configuration: the optional `linkText` per client gives users control over how each base URL appears in the UI.

---
See issue for details: https://github.com/darthjee/navi/issues/559

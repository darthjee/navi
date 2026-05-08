# Plan: Add Links and Favicon

## Overview

This plan covers two independent features:
1. **Links** — configurable links in the YAML web config, exposed via `/links.json` and displayed in the frontend menu.
2. **Favicon** — add a favicon to the frontend using the existing `navi.png` from the project root.

## Context

The `web` section of the YAML config currently has no support for links. The issue introduces a `links` list where each entry is either a plain URL string or an object with `text` and `url` fields. A new `Link` model wraps each entry. A new `/links.json` API endpoint exposes the list to the frontend, which renders them in a menu. Separately, `navi.png` (resized) is used as a browser favicon.

## Implementation Steps

### Step 1 — Add the `Link` model

Create `source/lib/models/configs/Link.js` with:
- A constructor accepting `url` and `text`.
- A static `fromObject(entry)` factory that handles both plain string entries (using the string as both `url` and `text`) and object entries (`{ text, url }`).
- A `toJSON()` / serialization method for the API response.
- Specs in `source/spec/lib/models/configs/Link_spec.js`.

### Step 2 — Update `WebConfig` to include links

Extend `source/lib/models/configs/WebConfig.js`:
- Add a `links` field parsed from the YAML `web.links` array using `Link.fromObject()`.
- Default to an empty array when the key is absent.
- Update the existing `WebConfig` spec.

### Step 3 — Add the `/links.json` request handler

Create `source/lib/server/handlers/LinksRequestHandler.js`:
- Extends `RequestHandler`.
- Returns the serialized list of `Link` objects from `WebConfig`.
- Specs in `source/spec/lib/server/handlers/LinksRequestHandler_spec.js`.

### Step 4 — Register the `/links.json` route

Update `source/lib/server/Router.js`:
- Register `GET /links.json` mapped to `LinksRequestHandler`.

### Step 5 — Frontend: links menu

In `frontend/`:
- Add an API client call to fetch `/links.json`.
- Create a `LinksMenu` component that renders the fetched links.
- Integrate `LinksMenu` into the main layout/navigation.

### Step 6 — Frontend: favicon

- Copy or reference `navi.png` from the project root into the frontend build assets.
- Add the `<link rel="icon">` tag to the HTML template (or configure Vite to emit the favicon).

## Files to Change

- `source/lib/models/configs/Link.js` — new `Link` model
- `source/lib/models/configs/WebConfig.js` — add `links` parsing
- `source/lib/server/handlers/LinksRequestHandler.js` — new handler
- `source/lib/server/Router.js` — register `/links.json` route
- `source/spec/lib/models/configs/Link_spec.js` — new spec
- `source/spec/lib/models/configs/WebConfig_spec.js` — update spec
- `source/spec/lib/server/handlers/LinksRequestHandler_spec.js` — new spec
- `frontend/src/` — new `LinksMenu` component + API client
- `frontend/index.html` (or Vite config) — favicon reference

## Notes

- The links and favicon features are independent and can be committed separately.
- The exact frontend file structure depends on the existing component hierarchy — verify before implementing Step 5.
- Confirm whether `navi.png` needs resizing at build time or if a pre-resized copy should be committed.
- The `Link` serialization format for the API should match whatever the frontend expects (`{ url, text }`).

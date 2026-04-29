# Issue: Add List of Base URLs

## Description

Navi reads client configurations that each have a `base_url`. A new API endpoint should
expose all unique base URLs, and the frontend header should display them — as a single
link/button when there is only one, or as a floating dropdown menu when there are many.

## Problem

- There is no way to see which base URLs are configured without reading the YAML config file.
- The frontend has no visibility into the clients' base URLs.

## Expected Behavior

### Backend

- A new endpoint `GET /clients/base_urls.json` returns the list of all unique `base_url`
  values from the loaded client configurations.

### Frontend

- The header shows the base URLs for all views.
- **Single base URL:** displayed as a single link/button.
- **Multiple base URLs:** a button that opens a floating menu listing all base URLs as
  links/buttons.
  - If there are more than 10 base URLs, the floating menu has a scrollable area.

## Solution

- Add a new route and request handler for `GET /clients/base_urls.json` in the web server.
- Expose the client registry (or the list of base URLs) to the handler.
- Add a new React component in the frontend header that:
  - Fetches `/clients/base_urls.json` on mount.
  - Renders a single link/button if only one URL is returned.
  - Renders a dropdown/floating menu if multiple URLs are returned, with scroll support
    when the count exceeds 10.

## Benefits

- Operators can quickly see and access the configured base URLs directly from the UI.
- Works across all views since it lives in the header.

---
See issue for details: https://github.com/darthjee/navi/issues/413

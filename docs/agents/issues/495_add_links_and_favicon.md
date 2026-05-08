# Issue: Add Links and Favicon

## Description

The project needs to support configurable links exposed through a `/links.json` API and displayed in the frontend menu. Additionally, a favicon should be added to the frontend using the existing `navi.png` image from the project root.

## Problem

- There is no way to configure custom links in the web configuration.
- The frontend has no links menu.
- The frontend has no favicon.

## Expected Behavior

- The `web` section of the YAML config supports a `links` list:
  ```yaml
  web:
    links:
      - http://link.com
      - text: some text
        url: http://someotherlink.com
  ```
- Each entry can be either a plain URL string (used as both URL and display text) or an object with `text` and `url` fields.
- The application wraps each entry in a `Link` object on load.
- A new `/links.json` endpoint returns the list of configured links.
- The frontend displays the links inside a menu.
- The frontend includes a favicon using `navi.png` (resized) from the project root.

## Solution

- Add a `links` field to the `WebConfig` model, parsing each entry into a `Link` object.
- Implement the `/links.json` API endpoint and its request handler.
- Update the frontend to fetch and display the links in a menu component.
- Add the favicon to the frontend build using `navi.png`.

## Benefits

- Users can expose useful external links directly from the Navi web UI.
- The favicon improves the application's visual identity in the browser.

---
See issue for details: https://github.com/darthjee/navi/issues/495

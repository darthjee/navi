# Issue: Disable Shutdown Button on Configuration

## Description

The shutdown button in the web UI is always visible and available. A configuration option is needed to disable it, so that demo deployments (or any deployment where shutdown should be restricted) can hide the button entirely.

## Problem

- The shutdown button has no way to be disabled via configuration.
- A public demo release should not expose the ability to shut down the service.
- There is no endpoint to expose runtime settings to the frontend.

## Expected Behavior

- A new `web.enable_shutdown` config option (defaulting to `true`) controls whether shutdown is permitted.
- A `GET /settings.json` endpoint returns `{ "enable_shutdown": true/false }`.
- While the settings are being loaded, the shutdown button is completely hidden (not rendered at all).
- The shutdown button is only rendered once the settings are fetched **and** `enable_shutdown` is `true`.
- The endpoint rejects requests with a `4xx` response when shutdown is not enabled.

## Solution

- Add `enable_shutdown` field to the `web` section of the YAML config (default: `true`).
- Implement `GET /settings.json` route that reads the config and returns the setting as JSON.
- Return a `4xx` error from that endpoint (or from the shutdown endpoint itself) when `enable_shutdown` is `false`.
- Update the frontend to fetch `/settings.json` on load; the button starts completely hidden and is only shown once the response confirms `enable_shutdown: true`.

## Benefits

- Allows safe demo deployments without exposing destructive controls.
- Provides a general-purpose settings endpoint that can be extended for future frontend configuration needs.

---
See issue for details: https://github.com/darthjee/navi/issues/486

# Plan: Test Download of Assets

## Overview

Update `docker_volumes/config/navi_config.yml` to cover all resources currently declared in the dev app, exercising every relevant route type (HTML pages with assets, JSON endpoints, redirects, and hash-based SPA routes). Update the README files with asset-fetching configuration examples.

## Context

The dev app now has a frontend and Navi supports asset downloading. The local config file has not yet been updated to reflect the full set of dev app resources and route types. This issue validates the end-to-end pipeline and produces documentation that shows users how to configure asset fetching.

## Implementation Steps

### Step 1 — Inventory dev app resources

Read the dev app route configuration (`dev/app/lib/routes.config.js` and `dev/app/lib/redirect_routes.config.js`) to list all currently declared resources and their URLs.

### Step 2 — Update `navi_config.yml`

For each resource identified in Step 1, add the appropriate entries to `docker_volumes/config/navi_config.yml`:
- JSON endpoints (`/resource.json`, status `200`)
- Redirect URLs (`/resource`, status `302`)
- Hash-based SPA routes (`/#/resource`, status `200`)
- Home / HTML pages that include asset fetching config (JS/CSS selectors)

### Step 3 — Update documentation

Update the following files to include examples of asset-fetching configuration:
- `README.md`
- `DOCKERHUB_DESCRIPTION.md`
- `source/README.md`

## Files to Change

- `docker_volumes/config/navi_config.yml` — add all dev app resources with full route coverage
- `README.md` — add asset-fetching config example
- `DOCKERHUB_DESCRIPTION.md` — add asset-fetching config example
- `source/README.md` — add asset-fetching config example

## Notes

- Need to inventory all resources declared in `dev/app/` before writing the config.
- Asset-fetching config (CSS selectors for JS/CSS links) must match what the dev app frontend actually serves.
- Not all resources may have all three route types — only add what the dev app actually declares.

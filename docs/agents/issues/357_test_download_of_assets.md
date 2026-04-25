# Issue: Test Download of Assets

## Description

Now that the dev app has a frontend and Navi can download assets, the integration should be validated end-to-end by updating the local Navi configuration to exercise all the new route types (HTML pages with assets, JSON endpoints, and redirects). Documentation must also be updated with asset-fetching examples.

## Problem

- The `docker_volumes/config/navi_config.yml` configuration does not yet include routes that cover HTML pages with assets, redirect responses, or hash-based SPA routes.
- `README.md`, `DOCKERHUB_DESCRIPTION.md`, and `source/README.md` lack examples showing how to configure Navi to fetch assets.

## Expected Behavior

The Navi config exercises the following route types:

```yaml
resources:
  home:
    - url: /          # HTML page — expects template + assets (JS/CSS)
      status: 200
      # asset fetching configuration here

  categories:
    - url: /categories.json   # JSON endpoint
      status: 200
    - url: /categories        # redirect
      status: 302
    - url: /#/categories      # hash-based SPA route — expects HTML template
      status: 200
```

## Solution

- Update `docker_volumes/config/navi_config.yml` to include the resources above with proper asset-fetching configuration.
- Update `README.md`, `DOCKERHUB_DESCRIPTION.md`, and `source/README.md` to document how to configure asset fetching with examples.

## Benefits

- Validates the full asset-download pipeline end-to-end in a realistic dev environment.
- Provides users with concrete configuration examples for asset fetching.

---
See issue for details: https://github.com/darthjee/navi/issues/357

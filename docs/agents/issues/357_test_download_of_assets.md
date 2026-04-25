# Issue: Test Download of Assets

## Description

Now that the dev app has a frontend and Navi can download assets, the integration should be validated end-to-end by updating the local Navi configuration to exercise all the new route types (HTML pages with assets, JSON endpoints, and redirects). Documentation must also be updated with asset-fetching examples.

## Problem

- The `docker_volumes/config/navi_config.yml` configuration does not yet include routes that cover HTML pages with assets, redirect responses, or hash-based SPA routes.
- `README.md`, `DOCKERHUB_DESCRIPTION.md`, and `source/README.md` lack examples showing how to configure Navi to fetch assets.

## Expected Behavior

The Navi config is updated to cover **all resources currently declared in the dev app**, not just `categories`. For each resource, all relevant route types should be represented:

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

  # ... same pattern for every other resource declared in the dev app
```

## Solution

- Identify all resources currently declared in the dev app (`dev/app/`).
- Update `docker_volumes/config/navi_config.yml` to include every resource with its full set of route types (JSON, redirect, and hash-based SPA route where applicable) and proper asset-fetching configuration.
- Update `README.md`, `DOCKERHUB_DESCRIPTION.md`, and `source/README.md` to document how to configure asset fetching with examples.

## Benefits

- Validates the full asset-download pipeline end-to-end in a realistic dev environment.
- Provides users with concrete configuration examples for asset fetching.

---
See issue for details: https://github.com/darthjee/navi/issues/357

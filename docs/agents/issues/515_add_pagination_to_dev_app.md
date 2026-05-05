# Issue: Add Pagination to Dev App

## Description

The dev app JSON endpoints currently return all entries without any pagination. Pagination support needs to be added so clients can request specific pages of results with configurable page sizes.

## Problem

- JSON endpoints (e.g. `/categorie.json`) return all records in a single response
- No way to limit or page through large result sets
- No configuration for default page size

## Expected Behavior

- Endpoints accept a `page` query parameter to select a specific page:
  ```
  GET /categorie.json?page=1
  ```
- Endpoints accept an optional `page_size` parameter:
  ```
  GET /categorie.json?page=2&page_size=10
  ```
- When `page_size` is omitted, a default value is read from a new configuration file:
  ```yaml
  json:
    perPage: 5
  ```

## Solution

- Create a new configuration class that loads the `json` section of the config at application boot (so it can be extended later)
- Update JSON endpoint handlers to read `page` and `page_size` query params
- Apply pagination logic when fetching and returning records

## Benefits

- Prevents large payloads from being returned when datasets grow
- Makes the dev app endpoints more realistic and closer to production-like behavior
- Lays groundwork for a reusable config class that can be extended

---
See issue for details: https://github.com/darthjee/navi/issues/515

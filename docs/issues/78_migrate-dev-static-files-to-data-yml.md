#78: Migrate Static Dev Files to `dev/data.yml`

Parent issue: https://github.com/darthjee/navi/issues/68

## Background

The `./dev/` directory currently holds static JSON files served by the Apache `navi_httpd` container:

```
dev/
  categories.json
  categories/1.json
  categories/1/itens.json
  categories/2.json
  categories/2/itens.json
  categories/3.json
  categories/3/itens.json
```

As part of replacing Apache with an Express server, all this data must be consolidated into a single `dev/data.yml` file.

## Task

1. Create `dev/data.yml` consolidating all static data following the structure defined in [`docs/plans/68_change-dev-container-to-express/data-format.md`](../plans/68_change-dev-container-to-express/data-format.md).
2. Remove all existing static JSON files and subdirectories from `./dev/`.

## Acceptance Criteria

- [ ] `dev/data.yml` exists and contains all categories and items previously in the static files.
- [ ] All static JSON files and subdirectories are removed from `./dev/`.

# 78: Migrate Static Dev Files to `new-dev/data.yml`

Parent issue: <https://github.com/darthjee/navi/issues/68>
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

As part of replacing Apache with an Express server, all this data must be consolidated into a single YAML file. To keep the existing `dev/` setup working during the transition, the new file is created in a separate `new-dev/` directory. The rename to `dev/` happens in the final issue (#82).

## Task

1. Create `new-dev/data.yml` consolidating all static data following the structure defined in [`docs/plans/68_change-dev-container-to-express/data-format.md`](../plans/68_change-dev-container-to-express/data-format.md).
2. Leave `./dev/` and the existing `navi_httpd` container untouched.

## Acceptance Criteria

- [ ] `new-dev/data.yml` exists and contains all categories and items from the static files.
- [ ] `./dev/` and the existing `navi_httpd` container continue to work as before.

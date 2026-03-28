# Plan: Migrate Static Dev Files to `dev/data.yml` (#78)

Issue: https://github.com/darthjee/navi/issues/78
Parent: https://github.com/darthjee/navi/issues/68

## Context

The `./dev/` directory currently holds 7 static JSON files served by the Apache `navi_httpd`
container. These must be consolidated into a single `dev/data.yml` before the Express server
(#79) can be built.

## Step 1 — Create `dev/data.yml`

Create the file with all data from the existing static files:

```yaml
categories:
  - id: 1
    name: Books
    items:
      - id: 1
        name: The Hobbit
      - id: 2
        name: The Lord of the Rings
      - id: 3
        name: The Silmarillion
  - id: 2
    name: Movies
    items:
      - id: 4
        name: The Shawshank Redemption
      - id: 5
        name: The Godfather
      - id: 6
        name: The Dark Knight
  - id: 3
    name: Music
    items:
      - id: 7
        name: The Beatles
      - id: 8
        name: Nirvana
      - id: 9
        name: Queen
```

Data sources:
- Category list → `dev/categories.json`
- Category detail → `dev/categories/<id>.json`
- Items per category → `dev/categories/<id>/itens.json`

## Step 2 — Remove static files

Delete all static JSON files and subdirectories from `./dev/`:

```
dev/categories.json
dev/categories/1.json
dev/categories/1/itens.json
dev/categories/2.json
dev/categories/2/itens.json
dev/categories/3.json
dev/categories/3/itens.json
```

## Acceptance Criteria

- [ ] `dev/data.yml` exists with all categories and items.
- [ ] All static JSON files and subdirectories are removed from `./dev/`.

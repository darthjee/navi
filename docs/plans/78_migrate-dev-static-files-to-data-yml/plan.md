# Plan: Migrate Static Dev Files to `new-dev/data.yml` (#78)

Issue: <https://github.com/darthjee/navi/issues/78>
Parent: <https://github.com/darthjee/navi/issues/68>

## Context

The `./dev/` directory currently holds 7 static JSON files served by the Apache `navi_httpd`
container. The data must be consolidated into a single `new-dev/data.yml` before the Express
server (#79) can be built.

`./dev/` is left untouched so the existing Apache container keeps working throughout the
transition. The final rename (`new-dev/` → `dev/`) happens in issue #82.

## Step 1 — Create `new-dev/data.yml`

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

## Acceptance Criteria

- [ ] `new-dev/data.yml` exists with all categories and items.
- [ ] `./dev/` and the existing Apache container are untouched.

# YAML Data Format and Generated Endpoints

## `dev_server/data.yml` Structure

```yaml
categories:
  - id: 1
    name: Books
    items:
      - id: 1
        name: "The Hobbit"
      - id: 2
        name: "1984"
  - id: 2
    name: Movies
    items:
      - id: 1
        name: "Inception"
  - id: 3
    name: Music
    items:
      - id: 1
        name: "Dark Side of the Moon"
```

The top-level key must be `categories`. Each category requires `id`, `name`, and `items`.
Each item requires `id`; any additional fields are passed through as-is in the JSON response.

## Generated Endpoints

The Express app registers the following routes at startup from the YAML data:

### `GET /categories.json`

Returns the full list of categories (without `items`).

```json
[
  { "id": 1, "name": "Books" },
  { "id": 2, "name": "Movies" },
  { "id": 3, "name": "Music" }
]
```

### `GET /categories/:id.json`

Returns a single category by `id` (without `items`). Returns `404` if not found.

```json
{ "id": 1, "name": "Books" }
```

### `GET /categories/:id/items.json`

Returns all items for a category. Returns `404` if the category is not found.

```json
[
  { "id": 1, "name": "The Hobbit" },
  { "id": 2, "name": "1984" }
]
```

### `GET /categories/:id/items/:item_id.json`

Returns a single item within a category. Returns `404` if either the category or item is not found.

```json
{ "id": 1, "name": "The Hobbit" }
```

## Extending the Data

To add or modify data, edit `dev_server/data.yml` and restart the `navi_httpd` container:

```bash
docker compose restart navi_httpd
```

No rebuild is required because `data.yml` is mounted as a volume.

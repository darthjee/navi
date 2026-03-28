#79: Create Express Dev Server

Parent issue: https://github.com/darthjee/navi/issues/68
Depends on: #78

## Background

With `dev/data.yml` in place (X01), we need the Node.js Express application that reads it at startup and dynamically registers all endpoints.

## Task

Create the following files in `dev/`:

### `dev/app.js`

Express app that:
1. Reads `data.yml` at startup using `js-yaml`.
2. Registers four route groups dynamically from the loaded data:
   - `GET /categories.json` — returns all categories (without `items`).
   - `GET /categories/:id.json` — returns a single category by `id`; `404` if not found.
   - `GET /categories/:id/items.json` — returns all items for a category; `404` if not found.
   - `GET /categories/:id/items/:item_id.json` — returns a single item; `404` if not found.
3. Returns a JSON `404` response for unmatched routes.
4. Listens on port `80`.

See [`docs/plans/68_change-dev-container-to-express/data-format.md`](../plans/68_change-dev-container-to-express/data-format.md) for expected request/response examples.

### `dev/package.json`

Minimal package definition with `express` and `js-yaml` as dependencies. Run `yarn install` to generate `dev/yarn.lock`.

## Acceptance Criteria

- [ ] `dev/app.js`, `dev/package.json`, and `dev/yarn.lock` exist.
- [ ] Starting the app with `node app.js` serves correct JSON on all four endpoints.
- [ ] Unmatched routes return a `404` JSON response.

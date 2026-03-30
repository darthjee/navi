# Issue 68: Change Dev Container to Use Express

Issue Link: <https://github.com/darthjee/navi/issues/68>

## Background

Currently, our development environment includes a container named `navi_httpd`, which runs a simple Apache server. This container serves as a backend for testing Navi: requests are sent to `navi_proxy`, which forwards them to `navi_httpd`, allowing us to observe cache warming behavior in `navi_proxy`. However, `navi_httpd` is a static Apache server and does not provide the flexibility needed for more advanced or dynamic testing scenarios.

## Proposal

Replace the `navi_httpd` Apache container with a Node.js application running an Express server. This new server will be based on the `darthjee/node` Docker image and will dynamically generate endpoints and responses based on a YAML data file.

### Key Features

- **Express Server:** The new dev backend will be a Node.js application using Express.
- **YAML-Driven Endpoints:** All JSON data served by the backend will be defined in a YAML file. The structure will include:
  - A top-level `categories` array, each with an `id` and an `items` array.
  - Each `item` in `items` will have its own `id` and attributes.
- **Dynamic Routing:** The Express app will generate endpoints such as:
  - `/categories.json` – returns all categories.
  - `/categories/:id.json` – returns a single category by ID.
  - `/categories/:id/items.json` – returns all items for a category.
  - `/categories/:id/items/:item_id.json` – returns a single item by ID within a category.
- **Flexible Data:** Changing the YAML file will automatically update the data served by the endpoints, making it easy to test different scenarios.

## Sub-issues

- [x] [#78 Migrate dev data to YAML](https://github.com/darthjee/navi/issues/78)
- [x] [#79 Create Express dev server](https://github.com/darthjee/navi/issues/79)
- [ ] [#86 Add tests suite for new-dev container](https://github.com/darthjee/navi/issues/86)
- [ ] [#80 Add Dockerfile for Express dev server](https://github.com/darthjee/navi/issues/80)
- [ ] [#81 Wire Express container into docker-compose](https://github.com/darthjee/navi/issues/81)
- [ ] [#82 Finalise dev container migration](https://github.com/darthjee/navi/issues/82)

## Acceptance Criteria

- The `navi_httpd` container is replaced by a Node.js Express app, built from the `darthjee/node` image.
- The Express app reads a YAML file at startup and generates all endpoints and responses accordingly.
- Endpoints match the structure described above and return the correct JSON data.
- The new setup integrates seamlessly with `navi_proxy` for cache warming tests.
- Documentation is updated to reflect the new development workflow and how to modify the YAML data file.

## Benefits

- Greater flexibility for testing various data and endpoint scenarios.
- Easier to extend and maintain compared to a static Apache server.
- Enables more realistic and dynamic cache warming tests for Navi.

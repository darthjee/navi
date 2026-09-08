# Navi

[![Build Status](https://circleci.com/gh/darthjee/navi.svg?style=shield)](https://circleci.com/gh/darthjee/navi)

Cache Warmer Tool

---

## Overview

Navi is a queue-based cache-warmer written in Node.js, distributed as both a Docker image and an npm CLI package.
It reads a YAML configuration file, enqueues HTTP requests as jobs, and processes them concurrently using a configurable pool of workers.

Key features:

- Concurrent HTTP request execution via a worker pool.
- URL templates with placeholder parameters (e.g. `{:id}`).
- Response-driven actions: after each successful request, configurable actions extract variables from the response and trigger follow-up processing.
- Paginated resource support: `paginated_actions` fan out one request per page based on a page-count expression evaluated against the response.
- Automatic retry of failed requests after the main queue is exhausted.

---

## Installation

### Via npx (no install required)

```bash
npx navi-hey --config /path/to/your/config.yml
```

### Global install

```bash
# npm
npm install -g navi-hey

# yarn
yarn global add navi-hey
```

Then run:

```bash
navi-hey --config /path/to/your/config.yml
```

---

## Configuration File

Navi is configured via a YAML file that defines HTTP clients, resources, and the worker
pool size. See the [configuration schema](https://github.com/darthjee/navi/blob/main/docs/guides/navi/configuration-schema.md)
for the full field-by-field reference.

---

## Resource Chaining

Navi supports multi-level resource chaining. After a successful response, each configured action uses `parameters` path expressions to extract variables from the response body or headers and enqueues new jobs for the target resource. The extracted variables resolve `{:placeholder}` tokens in the target URL templates.

For example, requesting `/categories.json` might return `[{ "id": 1 }, { "id": 2 }]`. With an action targeting `category_information` and `parameters: { id: parsedBody.id }`, Navi automatically enqueues requests for `/categories/1.json` and `/categories/2.json`. Header values can also be extracted, e.g. `page: headers['x-next-page']`.

> **Note:** HTTP response header names are always lowercase after Node.js normalization. Use lowercase keys in path expressions (e.g. `headers['x-total-pages']`), regardless of how the server set them.

## Paginated Actions

`paginated_actions` complement `actions` when the response indicates multiple pages. Instead of iterating over array items, Navi evaluates a `pages` expression against the whole response, then enqueues one `ResourceRequestJob` per page, injecting the page number under the configured `page_key`. An optional `parameters` map (same syntax as `actions[].parameters`) is resolved against that same response and merged into every page's request parameters, overriding same-named inherited parameters — though `page_key`'s value always wins on collision.

```yaml
resources:
  categories:
    - url: /categories.json
      status: 200
      paginated_actions:
        - resource: products_page
          pagination:
            - pages: parsedBody.pagination.pages
            - page_key: page
            - zero_indexed: false
          parameters:
            per_page: headers['x-per-page']
  products_page:
    - url: /products/{:page}.json
      status: 200
```

---

## Docker

Navi is also distributed as a Docker image for environments where Docker is preferred:

```bash
docker run --rm \
  -v /path/to/your/config.yml:/home/node/app/config/navi_config.yml \
  darthjee/navi-hey:latest \
  node navi.js config/navi_config.yml
```

---

## Source & Documentation

GitHub repository: [darthjee/navi](https://github.com/darthjee/navi)

Integration guide for developers and AI agents: [How to Use Navi in Your Project](https://github.com/darthjee/navi/blob/main/docs/guides/how_to_use_navi.md)

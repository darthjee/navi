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

Navi is configured via a YAML file that defines HTTP clients, resources, and the worker pool size.

### Structure

```yaml
workers:
  quantity: 5          # number of concurrent workers (default: 1)
  retry_cooldown: 2000 # ms before a failed job is retried (default: 2000)

log:
  size: 100            # max number of log entries kept in memory (default: 100)

web:
  port: 3000           # port for the monitoring web UI (omit to disable)

clients:
  default:
    base_url: https://example.com
  auth_api:
    base_url: https://api.example.com
    headers:
      Authorization: Bearer $API_TOKEN

resources:
  categories:
    - url: /categories.json
      status: 200
      actions:
        - resource: category_information
        - resource: products
          parameters:
            category_id: parsed_body.id
            page: headers['x-next-page']
  category_information:
    - url: /categories/{:id}.json
      status: 200
      client: auth_api
  products:
    - url: /categories/{:category_id}/products/{:page}.json
      status: 200
```

### Fields

| Field | Description |
|-------|-------------|
| `workers.quantity` | Number of concurrent workers. Defaults to `1`. |
| `workers.retry_cooldown` | Milliseconds a failed job waits before being re-queued for retry. Defaults to `2000`. |
| `log.size` | Maximum number of log entries kept in the in-memory log buffer. Defaults to `100`. |
| `web.port` | Port for the local monitoring web UI. Omit the `web` key entirely to run Navi without the web server. |
| `clients.<name>.base_url` | Base URL for the named HTTP client. |
| `clients.<name>.headers` | Optional HTTP headers sent with every request of this client. Header values support environment variable references (`$VAR` or `${VAR}`), resolved at configuration load time. |
| `resources.<name>` | A named group of URL requests to warm. |
| `url` | URL path (appended to the client's `base_url`). Supports `{:placeholder}` tokens. |
| `status` | Expected HTTP response status code. Navi marks a request as failed if the actual status differs. |
| `client` | Name of the client to use for this request. Defaults to `default`. |
| `actions` | Optional list of actions to execute after a successful response. |
| `actions[].resource` | Name of the resource to act upon. Required. |
| `actions[].parameters` | Optional key-value map. Each key is the destination variable name and each value is a path expression resolved against the response (e.g. `parsed_body.id`, `headers['page']`). When absent, the parsed body item is passed through unchanged. |

---

## Resource Chaining

Navi supports multi-level resource chaining. After a successful response, each configured action uses `parameters` path expressions to extract variables from the response body or headers and enqueues new jobs for the target resource. The extracted variables resolve `{:placeholder}` tokens in the target URL templates.

For example, requesting `/categories.json` might return `[{ "id": 1 }, { "id": 2 }]`. With an action targeting `category_information` and `parameters: { id: parsed_body.id }`, Navi automatically enqueues requests for `/categories/1.json` and `/categories/2.json`.

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

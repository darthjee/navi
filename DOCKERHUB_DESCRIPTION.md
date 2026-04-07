# Navi

[![Codacy Badge](https://app.codacy.com/project/badge/Grade/d931f6260973439f850c20869eeb5d83)](https://app.codacy.com/gh/darthjee/navi/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_grade)
[![Codacy Badge](https://app.codacy.com/project/badge/Coverage/d931f6260973439f850c20869eeb5d83)](https://app.codacy.com/gh/darthjee/navi/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_coverage)
[![Build Status](https://circleci.com/gh/darthjee/navi.svg?style=shield)](https://circleci.com/gh/darthjee/navi)

![navi](https://raw.githubusercontent.com/darthjee/navi/master/navi.png)

Cache Warmer Tool

---

## Overview

Navi is a queue-based cache-warmer written in Node.js and distributed as a Docker image.
It reads a YAML configuration file, enqueues HTTP requests as jobs, and processes them concurrently using a configurable pool of workers.

Key features:

- Concurrent HTTP request execution via a worker pool.
- URL templates with placeholder parameters (e.g. `{:id}`).
- Resource chaining: downstream jobs are enqueued automatically based on the response of a parent request.
- Automatic retry of failed requests after the main queue is exhausted.

---

## Quick Start

```bash
docker run --rm \
  -v /path/to/your/config.yml:/home/node/app/config/navi_config.yml \
  darthjee/navi:latest \
  node navi.js config/navi_config.yml
```

---

## Configuration File

Navi is configured via a YAML file that defines HTTP clients, resources, and the worker pool size.

### Structure

```yaml
workers:
  quantity: 5          # number of concurrent workers (default: 1)
  retry_cooldown: 2000 # ms before a failed job is retried (default: 2000)

web:
  port: 3000           # port for the monitoring web UI (omit to disable)

clients:
  default:
    base_url: https://example.com
  auth_api:
    base_url: https://api.example.com
    headers:
      Authorization: Bearer <token>

resources:
  categories:
    - url: /categories.html
      status: 302
    - url: /categories.json
      status: 200
      actions:
        - resource: category
          params:
            id: id
        - resource: items
          params:
            category_id: id
  category:
    - url: /categories/{:id}.html
      status: 302
    - url: /categories/{:id}.json
      status: 200
      client: auth_api
```

### Fields

| Field | Description |
|-------|-------------|
| `workers.quantity` | Number of concurrent workers. Defaults to `1`. |
| `workers.retry_cooldown` | Milliseconds a failed job waits before being re-queued for retry. Defaults to `2000`. |
| `web.port` | Port for the local monitoring web UI. Omit the `web` key entirely to run Navi without the web server. |
| `clients.<name>.base_url` | Base URL for the named HTTP client. |
| `clients.<name>.headers` | Optional HTTP headers sent with every request of this client. |
| `resources.<name>` | A named group of URL requests to warm. |
| `url` | URL path (appended to the client's `base_url`). Supports `{:placeholder}` tokens. |
| `status` | Expected HTTP response status code. Navi marks a request as failed if the actual status differs. |
| `client` | Name of the client to use for this request. Defaults to `default`. |
| `actions` | List of downstream resources to enqueue after a successful response, with parameter mappings. |

---

## Source

GitHub repository: [darthjee/navi](https://github.com/darthjee/navi)

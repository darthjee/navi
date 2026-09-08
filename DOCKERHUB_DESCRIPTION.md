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
- Response-driven actions: after each successful request, configurable actions extract variables from the response and trigger follow-up processing.
- Paginated resource support: `paginated_actions` fan out one request per page based on a page-count expression evaluated against the response.
- Crawler support: an optional `parser` (`regex`, `json_path`, or `css`) extracts structured items from a response, and `emit` sends each one to an external endpoint.
- Automatic retry of failed requests after the main queue is exhausted.

---

## Quick Start

The image ships with a minimal, production-ready configuration baked in, so it works out of the box with zero volume mounts:

```bash
docker run -p 3000:3000 darthjee/navi-hey:latest
```

This brings up the monitoring web UI immediately at `http://localhost:3000`, staying up indefinitely (no auto-shutdown). No `resources:`/`clients:` are baked in — add those afterwards through the Navi client/API. Every setting is overridable via an environment variable, without editing or rebuilding the image:

| Env var | Default | Config field |
|---------|---------|--------------|
| `NAVI_CONFIG` | `./config/web.yml` | Path to the config file `navi-hey` loads. Selects which packed config runs. |
| `PORT` | `3000` | `web.port` |
| `LOGS_PAGE_SIZE` | `20` | `web.logs_page_size` |
| `ENABLE_SHUTDOWN` | `false` | `web.enable_shutdown` |
| `AUTOSTART` | `true` | `web.autostart` |
| `IDLE_TIMEOUT` | `0` (disabled) | `web.idle_timeout` |
| `API_TOKEN` | empty (disabled) | `web.api.token` |
| `WORKERS` | `1` | `workers.quantity` |
| `RETRY_COOLDOWN` | `2000` | `workers.retry_cooldown` |
| `WORKERS_SLEEP` | `500` | `workers.sleep` |
| `MAX_RETRIES` | `3` | `workers.max-retries` |

### Custom Configuration

To bring your own full configuration (with `resources:`/`clients:` of your own) instead:

```bash
docker run --rm \
  -v /path/to/your/config.yml:/home/node/app/config/navi_config.yml \
  darthjee/navi-hey:latest \
  node navi.js config/navi_config.yml
```

---

## Configuration File

Navi is configured via a YAML file that defines HTTP clients, resources, and the worker pool size. See the [configuration schema](https://github.com/darthjee/navi/blob/main/docs/guides/navi/configuration-schema.md) for the full field-by-field reference.

---

## Resource Chaining

Navi supports multi-level resource chaining. After a successful response, each configured action uses `parameters` path expressions to extract variables from the response body or headers and enqueues new jobs for the target resource. The extracted variables resolve `{:placeholder}` tokens in the target URL templates.

For example, requesting `/categories.json` might return `[{ "id": 1 }, { "id": 2 }]`. With an action targeting `category_information` and `parameters: { id: parsedBody.id }`, Navi automatically enqueues requests for `/categories/1.json` and `/categories/2.json`. Header values can also be extracted, e.g. `page: headers['x-next-page']`.

> **Note:** HTTP response header names are always lowercase after Node.js normalization. Use lowercase keys in path expressions (e.g. `headers['x-total-pages']`), regardless of how the server set them.

## Paginated Actions

`paginated_actions` complement `actions` when the response indicates multiple pages. Navi evaluates a `pages` expression against the whole response, then enqueues one `ResourceRequestJob` per page, injecting the page number under the configured `page_key`. This enables cache-warming of fully paginated APIs without manual configuration of every page.

---

## Source

GitHub repository: [darthjee/navi](https://github.com/darthjee/navi)

Integration guide for developers and AI agents: [How to Use Navi in Your Project](https://github.com/darthjee/navi/blob/main/docs/guides/how_to_use_navi.md)

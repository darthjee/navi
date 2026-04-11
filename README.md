# Navi

[![Codacy Badge](https://app.codacy.com/project/badge/Grade/d931f6260973439f850c20869eeb5d83)](https://app.codacy.com/gh/darthjee/navi/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_grade)
[![Codacy Badge](https://app.codacy.com/project/badge/Coverage/d931f6260973439f850c20869eeb5d83)](https://app.codacy.com/gh/darthjee/navi/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_coverage)
[![Build Status](https://circleci.com/gh/darthjee/navi.svg?style=shield)](https://circleci.com/gh/darthjee/navi)

![navi](https://raw.githubusercontent.com/darthjee/navi/master/navi.png)

Cache Warmer Tool

**Current Version:** [0.0.1](https://github.com/darthjee/navi/releases/tag/0.0.1)

**Next Release:** [0.0.2](https://github.com/darthjee/navi/compare/0.0.1...main)

---

## Table of Contents

- [Overview](#overview)
- [Configuration File](#configuration-file)
- [Running Navi](#running-navi)
- [Development](#development)
- [Running Tests](#running-tests)
- [Roadmap](#roadmap)

---

## Overview

Navi is a queue-based cache-warmer written in Node.js and distributed as a Docker image.
It reads a YAML configuration file, enqueues HTTP requests as jobs, and processes them concurrently using a configurable pool of workers.

Key features:

- Concurrent HTTP request execution via a worker pool.
- URL templates with placeholder parameters (e.g. `{:id}`).
- Response-driven actions: after each successful request, configurable actions extract variables from the response and trigger follow-up processing.
- Automatic retry of failed requests after the main queue is exhausted.

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
      Authorization: Bearer $API_TOKEN
      X-Custom-Header: static-value

resources:
  categories:
    - url: /categories.json
      status: 200
      actions:
        - resource: category_information  # passes all response fields as-is
        - resource: products
          variables_map:
            id: category_id   # response field "id" → variable "category_id"
  category_information:
    - url: /categories/{:id}.json
      status: 200
      client: auth_api      # use a specific named client for this request
      actions:
        - resource: kind
          variables_map:
            kind_id: id       # response field "kind_id" → variable "id"
  products:
    - url: /categories/{:category_id}/products.json
      status: 200
  kind:
    - url: /kinds/{:id}.json
      status: 200
```

### Fields

| Field | Description |
|-------|-------------|
| `workers.quantity` | Number of concurrent workers. Defaults to `1`. |
| `workers.retry_cooldown` | Milliseconds a failed job waits before being re-queued for retry. Defaults to `2000`. |
| `web.port` | Port for the local monitoring web UI. Omit the `web` key entirely to run Navi without the web server. |
| `clients.<name>.base_url` | Base URL for the named HTTP client. |
| `clients.<name>.headers` | Optional HTTP headers sent with every request of this client. Header values support environment variable references (`$VAR` or `${VAR}`), which are resolved at configuration load time. |
| `resources.<name>` | A named group of URL requests to warm. |
| `url` | URL path (appended to the client's `base_url`). Supports `{:placeholder}` tokens. |
| `status` | Expected HTTP response status code. Navi marks a request as failed if the actual status differs. |
| `client` | Name of the client to use for this request. Defaults to `default`. |
| `actions` | Optional list of actions to execute after a successful response. Each action names a `resource` and an optional `variables_map`. |
| `actions[].resource` | Name of the resource to act upon. Required. |
| `actions[].variables_map` | Optional key-value map. Each entry renames a response field: `<response_field>: <new_variable_name>`. When absent, all response fields are passed through unchanged. |

### Providing the config file

When running via Docker (the recommended approach), mount the YAML file as a volume:

```bash
docker run --rm \
  -v /path/to/your/config.yml:/home/node/app/config/navi_config.yml \
  navi:latest \
  node navi.js config/navi_config.yml
```

In the development environment the config file lives at `docker_volumes/config/navi_config.yml` and is automatically mounted into the container.

---

## Running Navi

### Docker (recommended)

1. Build the production image:

   ```bash
   make build
   ```

2. Run Navi with your configuration file:

   ```bash
   docker run --rm \
     -v /path/to/your/config.yml:/home/node/app/config/navi_config.yml \
     navi:latest \
     node navi.js config/navi_config.yml
   ```

### Local execution (Node.js)

Requires Node.js (see `source/package.json` for the engine version).

```bash
cd source
yarn install
node ../navi.js /path/to/your/config.yml
```

---

## Development

The development workflow is Docker-based. [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/) must be installed.

### First-time setup

```bash
make setup
```

This command:

1. Copies `.env.sample` to `.env`.
2. Builds the `base_build` Docker image.
3. Installs Node.js dependencies inside the container via `yarn install`.

> **Note:** Always use **Yarn** to manage dependencies. Do not use `npm install`.

### Starting a development shell

```bash
make dev
```

This opens an interactive Bash shell inside the `navi_app` container, where you can run `yarn test`, `yarn lint`, and other commands.

### Available Makefile commands

| Command | Description |
|---------|-------------|
| `make setup` | First-time environment setup (copies `.env`, builds image, installs deps). |
| `make dev` | Opens a shell in the `navi_app` container. |
| `make tests` | Opens a shell in the isolated `navi_tests` container. |
| `make build-dev` | Builds the development Docker image (`navi:dev`). |
| `make build` | Builds the production Docker image (`navi:latest`). |

---

## Running Tests

Tests are written with **Jasmine** and use **c8** for code coverage.

Inside the development container (via `make dev` or `make tests`):

```bash
yarn test    # run tests with coverage report
yarn lint    # run ESLint
yarn report  # run copy/paste analysis (JSCPD)
yarn docs    # generate JSDoc API documentation
```

---

## Actions & Response Chaining

After a successful HTTP response, Navi executes each configured `action` for every item in the response body. If the body is a JSON array, each action runs once per element; if it is a single object, each action runs once.

For each action, the `variables_map` is applied to the response item to produce a set of named variables:

- **With `variables_map`**: only the explicitly mapped fields are included, renamed as configured.
- **Without `variables_map`**: all response fields are passed through unchanged.

The mapped variables are then used to resolve `{:placeholder}` tokens in the target resource's URL templates. For example, if the response contains `{ "id": 1 }` and the action maps `id` → `id`, the target resource's URL `/categories/{:id}.json` resolves to `/categories/1.json`.

Each action is enqueued as an `ActionProcessingJob`, which looks up the target resource, creates a `ResourceRequestJob` for each URL entry in that resource with the resolved parameters, and enqueues them for processing by the worker pool. This enables multi-level resource chaining — a response can trigger further requests whose responses trigger even more requests.

**Error handling:** an action whose `resource` field is missing is skipped and logged. An action that references a field absent from the response item is also skipped and logged. Other actions continue normally. A response body that is not valid JSON raises an error for the whole request.

---

## Roadmap

The following features are planned but not yet implemented:

- **WorkersFactory** — the factory responsible for instantiating `Worker` instances is planned but not yet implemented. Workers are currently initialized directly inside `WorkersRegistry`.

### Web UI

Navi includes a built-in **read-only monitoring web UI** (built with React + React Bootstrap).
Enable it by adding a `web:` section to your configuration file:

```yaml
web:
  port: 3000
```

When enabled, the UI is accessible at `http://localhost:<port>` and displays the real-time state of all job queues:

- Jobs currently in queue.
- Jobs being processed.
- Finished jobs.
- Failed jobs (with last failure reason).
- Dead jobs (exceeded retry limit).


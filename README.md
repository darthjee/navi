Navi
========
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/d931f6260973439f850c20869eeb5d83)](https://app.codacy.com/gh/darthjee/navi/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_grade)
[![Codacy Badge](https://app.codacy.com/project/badge/Coverage/d931f6260973439f850c20869eeb5d83)](https://app.codacy.com/gh/darthjee/navi/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_coverage)
[![Build Status](https://circleci.com/gh/darthjee/navi.svg?style=shield)](https://circleci.com/gh/darthjee/navi)

![navi](https://raw.githubusercontent.com/darthjee/navi/master/navi.png)

Cache Warmer Tool

**Current Version:** not released yet

**Next Release:** [0.0.1](https://github.com/darthjee/navi/compare/68de3da...main)

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
- Resource chaining: downstream jobs are enqueued automatically based on the response of a parent request.
- Automatic retry of failed requests after the main queue is exhausted.

---

## Configuration File

Navi is configured via a YAML file that defines HTTP clients, resources, and the worker pool size.

### Structure

```yaml
workers:
  quantity: 5          # number of concurrent workers (default: 1)

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
            id: id          # map response field "id" → placeholder {:id}
        - resource: items
          params:
            category_id: id # map response field "id" → placeholder {:category_id}
  category:
    - url: /categories/{:id}.html
      status: 302
    - url: /categories/{:id}.json
      status: 200
      client: auth_api      # use a specific named client for this request
```

### Fields

| Field | Description |
|-------|-------------|
| `workers.quantity` | Number of concurrent workers. Defaults to `1`. |
| `clients.<name>.base_url` | Base URL for the named HTTP client. |
| `clients.<name>.headers` | Optional HTTP headers sent with every request of this client. |
| `resources.<name>` | A named group of URL requests to warm. |
| `url` | URL path (appended to the client's `base_url`). Supports `{:placeholder}` tokens. |
| `status` | Expected HTTP response status code. Navi marks a request as failed if the actual status differs. |
| `client` | Name of the client to use for this request. Defaults to `default`. |
| `actions` | List of downstream resources to enqueue after a successful response, with parameter mappings. |

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

## Roadmap

The following features are planned but not yet implemented:

- **WorkersFactory** — the factory responsible for instantiating `Worker` instances is planned but not yet implemented. Workers are currently initialized directly inside `WorkersRegistry`.
- **Web UI** — a local read-only monitoring interface (built with React + React Bootstrap) that will display the state of queued, in-progress, finished, failed, and dead jobs in real time.
- **First release (v0.0.1)** — the project has not yet had a tagged release.


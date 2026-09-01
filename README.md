# Navi

[![Codacy Badge](https://app.codacy.com/project/badge/Grade/d931f6260973439f850c20869eeb5d83)](https://app.codacy.com/gh/darthjee/navi/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_grade)
[![Codacy Badge](https://app.codacy.com/project/badge/Coverage/d931f6260973439f850c20869eeb5d83)](https://app.codacy.com/gh/darthjee/navi/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_coverage)
[![Build Status](https://circleci.com/gh/darthjee/navi.svg?style=shield)](https://circleci.com/gh/darthjee/navi)

![navi](https://raw.githubusercontent.com/darthjee/navi/master/navi.png)

Cache Warmer Tool

**Current Version:** [1.9.0](https://github.com/darthjee/navi/releases/tag/1.9.0)

**Next Release:** [1.9.1](https://github.com/darthjee/navi/compare/1.9.0...main)

**Client Current Version:** [0.2.0](https://github.com/darthjee/navi/releases/tag/client-0.2.0)

**Client Next Version:** [0.2.1](https://github.com/darthjee/navi/compare/client-0.2.0...main)

**Worker Current Version:** [1.9.0](https://github.com/darthjee/navi/releases/tag/worker-1.9.0)

**Worker Next Version:** [1.9.1](https://github.com/darthjee/navi/compare/worker-1.9.0...main)

Tagging a navi release now automatically publishes `deku-swarm` to npm and pushes a matching `worker-x.y.z` tag whenever `worker/` changed since the last worker release (or `force_worker_build` was explicitly set for that pipeline run) and that version isn't already published — no separate manual worker release step is needed anymore. Use `bump_version.sh worker [version]` beforehand to bump the worker version and the badges above. `force_worker_build` is a CircleCI pipeline parameter that can only be set by explicitly triggering a pipeline (UI/API "Trigger Pipeline"), not by a normal tag push.

---

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Configuration File](#configuration-file)
- [Running Navi](#running-navi)
- [Development](#development)
- [Running Tests](#running-tests)
- [Roadmap](#roadmap)
- [Installation](#installation)
- [How to Use Navi in Your Project](https://github.com/darthjee/navi/blob/main/docs/guides/how_to_use_navi.md)

---

## Overview

Navi is a queue-based cache-warmer written in Node.js and distributed as a Docker image.
It reads a YAML configuration file, enqueues HTTP requests as jobs, and processes them concurrently using a configurable pool of workers.

Key features:

- Concurrent HTTP request execution via a worker pool.
- URL templates with placeholder parameters (e.g. `{:id}`).
- Response-driven actions: after each successful request, configurable actions extract variables from the response and trigger follow-up processing.
- Paginated resource support: `paginated_actions` fan out one request per page based on a page-count expression evaluated against the response.
- Automatic retry of failed requests after the main queue is exhausted.
- Config splitting: split `resources`/`clients` across multiple files with top-level `include`/`namespace` keys, with validated cross-namespace references. See [How to Use Navi in Your Project](https://github.com/darthjee/navi/blob/main/docs/guides/navi/splitting-configuration.md) for details.

---

## Quick Start

The `darthjee/navi-hey` Docker image ships with a minimal, production-ready configuration (`web` — see `dockerfiles/production_navi_hey/config/web.yml`) baked in, so it works out of the box with zero volume mounts:

```bash
docker run -p 3000:3000 darthjee/navi-hey:latest
```

This brings up the monitoring web UI immediately at `http://localhost:3000`, and it stays up indefinitely (no auto-shutdown). The packed config declares no `resources:`/`clients:` — add those afterwards through the [Navi client/API](clients/node/README.md). Every setting in the packed config is overridable via an environment variable, without editing or rebuilding the image:

| Env var | Default | Config field |
|---------|---------|--------------|
| `NAVI_CONFIG` | `./config/web.yml` | Path to the config file `navi-hey` loads (`-c`/`--config`). Selects which packed config runs. |
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

For example, to change the exposed port:

```bash
docker run -p 8080:8080 -e PORT=8080 darthjee/navi-hey:latest
```

To bring your own full configuration (resources, clients, and more) instead, see [Custom Configuration](#custom-configuration) below.

---

## Configuration File

Navi is configured via a YAML file that defines HTTP clients, resources, and the worker pool size.

### Structure

```yaml
workers:
  quantity: 5          # number of concurrent workers (default: 1)
  retry_cooldown: 2000 # ms before a failed job is retried (default: 2000)
  sleep: 500           # ms the engine waits between allocation ticks (default: 500)
  max-retries: 3       # max number of retries before a job is marked dead (default: 3)

log:
  size: 100            # max number of log entries kept in memory (default: 100)

failure:
  threshold: 10.0      # optional: exit with failure if > 10% of jobs are dead

web:
  port: 3000           # port for the monitoring web UI (omit to disable)
  autostart: true       # whether the engine starts processing immediately at boot (default: true)
  idle_timeout: 900     # seconds of inactivity before auto-shutdown (default: 0, disabled)
  memory:
    maximum: 2147483648        # optional: memory ceiling in bytes (default: resolved automatically)
    thresholds:                # optional: percentage-of-maximum boundaries for the reported status
      low: 25.0
      medium: 50.0
      high: 75.0
      over: 100.0

clients:
  default:
    base_url: https://example.com
    timeout: 5000            # ms before the request times out (default: 5000)
  auth_api:
    base_url: https://api.example.com
    headers:
      Authorization: Bearer $API_TOKEN
      X-Custom-Header: static-value

resources:
  home:
    - url: /                   # HTML page — fetches linked JS and CSS assets
      status: 200
      assets:
        - selector: script[src]              # matches <script src="...">
          attribute: src
        - selector: link[rel="stylesheet"]   # matches <link rel="stylesheet" href="...">
          attribute: href
  categories:
    - url: /categories.json
      status: 200
      actions:
        - resource: category_information  # passes all response fields as-is
        - resource: products
          parameters:
            category_id: parsedBody.id   # extract "id" from parsed body → variable "category_id"
      paginated_actions:
        - resource: products_page
          pagination:
            - pages: parsedBody.pagination.pages  # total page count from response
            - page_key: page                      # inject as {:page} in URL template
            - zero_indexed: false                 # pages start at 1 (default)
    - url: /categories         # redirect — Navi validates the 302 status
      status: 302
    - url: /#/categories       # hash-based SPA route — same HTML template as home
      status: 200
  category_information:
    - url: /categories/{:id}.json
      status: 200
      client: auth_api      # use a specific named client for this request
      actions:
        - resource: kind
          parameters:
            id: parsedBody.kind_id       # extract "kind_id" from parsed body → variable "id"
  products:
    - url: /categories/{:category_id}/products/{:page}.json
      status: 200
      disabled: true   # optional: excludes this request from every enqueue path (see below)
  kind:
    - url: /kinds/{:id}.json
      status: 200
```

### Fields

| Field | Description |
|-------|-------------|
| `workers.quantity` | Number of concurrent workers. Defaults to `1`. |
| `workers.retry_cooldown` | Milliseconds a failed job waits before being re-queued for retry. Defaults to `2000`. |
| `workers.sleep` | Milliseconds the engine waits between allocation ticks. Defaults to `500`. |
| `workers.max-retries` | Maximum number of times a job is retried before being moved to the dead queue. Defaults to `3`. |
| `log.size` | Maximum number of log entries kept in the in-memory log buffer. Defaults to `100`. |
| `failure.threshold` | Optional. Percentage (0–100) of dead jobs that triggers a non-zero exit code. When absent, Navi always exits successfully. |
| `web.port` | Port for the local monitoring web UI. Omit the `web` key entirely to run Navi without the web server. |
| `web.autostart` | Optional. Whether the engine starts processing immediately at boot. Defaults to `true`; set to `false` to boot with the web server up but the engine paused until `PATCH /engine/start` is called. |
| `web.idle_timeout` | Optional. Seconds of sustained idleness (no busy workers, no jobs in any queue) before the application auto-shuts-down, same as `PATCH /engine/shutdown`. The countdown resets whenever a job exists or a worker becomes busy. Defaults to `0` (disabled — the web server lingers indefinitely). Independent of `web.enable_shutdown`. |
| `web.memory.maximum` | Optional. Memory ceiling in bytes used to compute the usage percentage exposed by `GET /memory/status.json`. When omitted, resolved automatically via a fallback chain: configured value → cgroup v2 limit → cgroup v1 limit → OS total memory. |
| `web.memory.thresholds.low` / `.medium` / `.high` / `.over` | Optional. Percentage-of-maximum boundaries used to derive the reported `status` (`low`/`medium`/`high`/`over`), checked from the top down with inclusive (`>=`) boundaries. Default `{low: 25, medium: 50, high: 75, over: 100}`. Must be strictly ascending (`low < medium < high < over`) or the config is rejected at startup. |
| `clients.<name>.base_url` | Base URL for the named HTTP client. Supports environment variable references (`$VAR` or `${VAR}`), resolved at configuration load time. |
| `clients.<name>.timeout` | Optional request timeout in milliseconds. Defaults to `5000`. |
| `clients.<name>.headers` | Optional HTTP headers sent with every request of this client. Header values support environment variable references (`$VAR` or `${VAR}`), resolved at configuration load time. |
| `resources.<name>` | A named group of URL requests to warm. |
| `url` | URL path (appended to the client's `base_url`). Supports `{:placeholder}` tokens. |
| `status` | Expected HTTP response status code. Navi marks a request as failed if the actual status differs. |
| `client` | Name of the client to use for this request. Defaults to `default`. |
| `disabled` / `enabled` | Optional. Set `disabled: true` (or `enabled: false`) on a resource-request entry to keep its YAML definition in place while excluding it from every enqueue path: startup, manual/API trigger by name, and as an `actions`/`paginated_actions` target. `disabled: true` always wins over any `enabled` value. Defaults to enabled. |
| `max_page` | Optional. When this request is the target of another resource's `paginated_actions`, caps how many of its pages ever get enqueued — a ceiling owned by this resource, applying uniformly to every caller. Counts pages, not page numbers (the first `max_page` pages in iteration order, whether `zero_indexed` or not). Omitted, `null`, `0`, or any other non-positive-integer value means unlimited; a present-but-invalid value also logs a warning. Defaults to unlimited. |
| `actions` | Optional list of actions to execute after a successful response. Each action names a `resource` and an optional `parameters` map. |
| `actions[].resource` | Name of the resource to act upon. Required. |
| `actions[].parameters` | Optional key-value map. Each key is the destination variable name and each value is a path expression resolved against the response wrapper (e.g. `parsedBody.id`, `headers['page']`). When absent, the parsed body item is passed through unchanged. |
| `paginated_actions` | Optional list of paginated actions to execute after a successful response. Each entry fans out one `ResourceRequestJob` per page. |
| `paginated_actions[].resource` | Name of the resource to enqueue per page. Required. |
| `paginated_actions[].pagination` | List of pagination config entries (see below). Required. |
| `paginated_actions[].pagination[].pages` | Path expression evaluated against the response (e.g. `parsedBody.pagination.pages`) that resolves to the total number of pages. |
| `paginated_actions[].pagination[].page_key` | The parameter name injected into each downstream request as the current page number. |
| `paginated_actions[].pagination[].zero_indexed` | Boolean. When `true`, page numbers start at `0`; when `false` (default), they start at `1`. |
| `paginated_actions[].parameters` | Optional key-value map, same syntax as `actions[].parameters`. Resolved against the same response used for `pages` and merged into each page's request parameters. `page_key`'s value always takes precedence on key collision. |
| `assets` | Optional list of asset extraction rules. When present on an HTML resource, Navi parses the response body and enqueues a download job for each matched URL. |
| `assets[].selector` | CSS selector used to find asset elements in the HTML response (e.g. `script[src]`, `link[rel="stylesheet"]`). |
| `assets[].attribute` | Attribute on the matched element that holds the asset URL (e.g. `src`, `href`). |
| `assets[].client` | Named client to use when fetching the asset. Defaults to `default`. |
| `assets[].status` | Expected HTTP status code for asset fetches. Defaults to `200`. |
| `parser` | Optional. Extracts structured items from the raw response body after a successful response, independently of the resource's own `actions`/`paginated_actions` chaining. |
| `parser.type` | One of `regex`, `json_path`, `css`. Selects the extraction strategy. |
| `parser.match` | Meaning depends on `type`: a regex pattern (`regex`), a dot-notation path to the array to extract items from, e.g. `data.items` (`json_path`), or a CSS selector for the repeated container elements (`css`). Required for all three. |
| `parser.filter` | Optional, `json_path`/`css` only. List of AND'ed conditions a matched item/container must satisfy to be included. `json_path`: each condition is `{ field, equals }` (literal comparison) or `{ field, equals_field }` (compares two fields of the same item; `equals_field` wins when both are given). `css`: each condition is `{ selector, attribute, trim, equals }` (literal, resolved relative to the container) or `{ ..., equals_field: { selector, attribute, trim } }` (field-to-field, both sides resolved relative to the container; `equals_field` wins when both are given). |
| `parser.fields` | Meaning depends on `type`. `json_path`: a `{ sourceKey: outputKey }` map remapping the matched item's keys into the output item. `css`: a `{ outputKey: { selector, attribute, array, trim } }` map (multi-field mode); each field is resolved relative to the matched container (an absent/empty `selector` means the container itself, `array: true` collects every match instead of just the first). |
| `parser.field` | `regex`: required, names the single output key populated with the captured value. `css`: fallback single-field mode's output key name, used when `fields` is absent. |
| `parser.attribute` | `css` fallback single-field mode only (used when `fields` is absent). Attribute to read off the matched container; reads text content when absent. |
| `parser.trim` | `css` fallback single-field mode only (used when `fields` is absent). Whether to trim the resolved value. Defaults to `true`. |
| `emit` | Optional. Sends each item extracted by `parser` to an external endpoint, one `EmitJob` per item. |
| `emit.client` | Name of the client to use for the emit request, reusing the same `clients.<name>` config as `resources.<name>.client`. |
| `emit.method` | One of `POST`, `PUT`, `PATCH`. Required. |
| `emit.url` | URL to emit the request to. Supports `{:placeholder}` tokens resolved from the request's own parameters. Required. |
| `emit.status` | Optional expected HTTP status code for the emit response. |
| `emit.headers` | Optional map of extra HTTP headers, merged over the client's own headers (`emit.headers` wins on key collision). Values support `$VAR`/`${VAR}` resolution like `clients.<name>.headers`. |
| `emit.body_template` | Optional object/array template used to wrap/re-shape the extracted item before it's sent as the emit request body. `{:key}`/`{:nested.path}` tokens resolve against the item; `{:.}` refers to the whole item. Defaults to sending the bare extracted item when omitted. |
| `emit.retries` / `emit.cooldown` | Optional. Override `EmitJob`'s default retry policy (see below) for this specific emit. Must be non-negative numbers when given. |
| `emit.size` | Optional. Top-level config key (a sibling of `resources`/`web`/`log`, not part of a resource's `emit` block) sizing the in-memory ring buffer behind `GET /emissions.json`. Defaults to `100`. |
| `extraction.size` | Optional. Top-level config key, sibling of `emit.size`, sizing the in-memory ring buffer behind `GET /extractions.json`. Defaults to `100`. |

`GET /memory/status.json` — unauthenticated, like the other `GET` monitoring endpoints (no `web.api.token` involved). Responds with:

```json
{ "current": 134217728, "maximum": 2147483648, "percentage": 6.25, "status": "low" }
```

`current`/`maximum` are byte counts (`current` is the process RSS); `percentage` is `current / maximum * 100`; `status` is one of `low`/`medium`/`high`/`over`, derived from `percentage` against `web.memory.thresholds`.

### Custom Configuration

To bring your own full configuration (with `resources:`/`clients:` of your own) instead of the packed zero-config default (see [Quick Start](#quick-start)), mount the YAML file as a volume:

```bash
docker run --rm \
  -v /path/to/your/config.yml:/home/node/app/config/navi_config.yml \
  darthjee/navi-hey:latest \
  node navi.js config/navi_config.yml
```

In the development environment the config file lives at `docker_volumes/config/navi_config.yml` and is automatically mounted into the container.

---

## Installation

### Via npm / yarn (npx)

No installation required — run Navi directly using `npx`:

```bash
npx navi-hey --config /path/to/your/config.yml
```

Or install globally:

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

> **Note:** The web UI frontend is bundled directly with the Navi package and served from `source/static/`. After making changes to the frontend code, run `yarn build` inside the `navi_frontend` Docker Compose service to update the bundled assets.

### Docker

See the [Running Navi](#running-navi) section below.

---

## Running Navi

### Docker (recommended)

1. Build the production image:

   ```bash
   make build
   ```

2. Run Navi with the packed zero-config default — see [Quick Start](#quick-start):

   ```bash
   docker run -p 3000:3000 darthjee/navi-hey:latest
   ```

   Or with your own configuration file — see [Custom Configuration](#custom-configuration):

   ```bash
   docker run --rm \
     -v /path/to/your/config.yml:/home/node/app/config/navi_config.yml \
     darthjee/navi-hey:latest \
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
2. Copies `docker_volumes/config/navi_config.yml.sample` to `docker_volumes/config/navi_config.yml` (if it does not already exist).
3. Builds the `base_build` Docker image.
4. Installs Node.js dependencies inside the container via `yarn install`.

> **Note:** Always use **Yarn** to manage dependencies. Do not use `npm install`.

### Starting a development shell

```bash
make dev
```

This opens an interactive Bash shell inside the `navi_app` container, where you can run `yarn test`, `yarn lint`, and other commands.

### Available Makefile commands

| Command | Description |
|---------|-------------|
| `make setup` | First-time environment setup (copies `.env` and `config.yml` from samples, builds image, installs deps). |
| `make dev` | Opens a shell in the `navi_app` container. |
| `make tests` | Opens a shell in the isolated `navi_tests` container. |
| `make build-dev` | Builds the development Docker image (`navi:dev`). |
| `make build` | Builds the production Docker image (`darthjee/navi-hey:latest`). |
| `make build-client` | Builds the production client Docker image (`darthjee/navi-hey-client:latest`). |

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

For each action, the `parameters` map is applied to the response wrapper to produce a set of named variables:

- **With `parameters`**: each value is a path expression (e.g. `parsedBody.id`, `headers['page']`) resolved against a wrapper exposing the parsed JSON body and response headers. Only the explicitly mapped fields are included.
- **Without `parameters`**: the parsed body item is passed through unchanged.

The mapped variables are then used to resolve `{:placeholder}` tokens in the target resource's URL templates. For example, if the response body contains `{ "id": 1 }` and the action has `parameters: { id: parsedBody.id }`, the target resource's URL `/categories/{:id}.json` resolves to `/categories/1.json`. Header values can also be extracted, e.g. `page: headers['page']`.

> **Note:** HTTP response header names are always lowercase after Node.js normalization. Use lowercase keys in path expressions (e.g. `headers['x-total-pages']`), regardless of how the server set them.

Each action is enqueued as an `ActionProcessingJob`, which looks up the target resource, creates a `ResourceRequestJob` for each URL entry in that resource with the resolved parameters, and enqueues them for processing by the worker pool. This enables multi-level resource chaining — a response can trigger further requests whose responses trigger even more requests.

**Error handling:** an action whose `resource` field is missing is skipped and logged. An action whose path expression cannot be resolved against the response is also skipped and logged. Other actions continue normally. A response body that is not valid JSON raises an error for the whole request.

---

## Paginated Actions

When a resource response indicates multiple pages, `paginated_actions` fan out one downstream `ResourceRequestJob` per page. This is configured alongside (or instead of) `actions` in a resource definition.

Each `paginated_action` entry specifies a `resource` and a `pagination` block:

- **`pages`** — a path expression evaluated against the response (e.g. `parsedBody.pagination.pages`) to determine the total page count.
- **`page_key`** — the parameter name injected as the current page number into each downstream request.
- **`zero_indexed`** — boolean; when `true` pages run from `0` to `pages-1`; when `false` (default) from `1` to `pages`.

Optionally, each `paginated_action` entry may also specify a **`parameters`** map (same syntax as `actions[].parameters`) — path expressions resolved against the same response used for `pages`, letting you forward server-reported metadata (e.g. a `per_page` value from a response header) into every paginated request without a separate fetch.

Each downstream request's final parameter set is built in this order (later wins on a key collision):

1. Parameters inherited from the parent chain (existing behavior).
2. The resolved `parameters` map, when present — overrides same-named inherited parameters.
3. `page_key`'s page number — always wins, even over a same-named `parameters` entry.

So `{:page}` (or whatever `page_key` is set to) can be used as a `{:placeholder}` in the target resource's URL template alongside other variables (e.g. `{:category_id}`, or any key from `parameters`). If a `parameters` path expression can't be resolved against the response, that one paginated action fails in isolation (no pages enqueued, logged, dead-lettered, no retry) — everything else in the run is unaffected.

Each paginated action is enqueued as a `PaginatedActionProcessingJob`. Unlike `ActionProcessingJob`, it operates on the whole response wrapper (not individual array items) and has no retry rights.

### Example

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
    - url: /products/{:page}.json?per_page={:per_page}
      status: 200
```

If the `/categories.json` response contains `{ "pagination": { "pages": 3 } }` with a `X-Per-Page: 25` response header, Navi enqueues three jobs for `/products/1.json?per_page=25`, `/products/2.json?per_page=25`, and `/products/3.json?per_page=25`.

### Capping pages with `max_page`

Sometimes you don't want to warm every page a `paginated_actions` caller reports — just the first few, most-likely-to-be-hit ones. `max_page` caps this from the **target** resource's side, independent of who calls it:

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
    - url: /products/{:page}.json?per_page={:per_page}
      status: 200
      max_page: 2
```

Even though `/categories.json` reports 3 pages, `products_page` caps itself at 2 — Navi enqueues only `/products/1.json?per_page=25` and `/products/2.json?per_page=25`. `max_page` is a property of `products_page` itself: **every** caller that fans out into it is capped the same way, not just this one. It counts pages, not page numbers, so it composes the same way regardless of `zero_indexed` (a `zero_indexed: true` caller capped at `max_page: 2` would enqueue pages `0` and `1`, not `1` and `2`).

Omitted, `null`, `0`, or any other non-positive-integer value means unlimited (all pages the caller resolves are enqueued) — the default. A present-but-invalid value (e.g. a negative number or a non-numeric string) also logs a warning.

---

## Data Extraction and Emission

After a successful response, a resource-request entry may optionally declare a `parser` and an `emit`. The `parser` extracts one or more structured items from the raw response body; `emit` then sends each extracted item as its own HTTP request to an external endpoint. This runs independently of (in parallel with) `actions`/`paginated_actions` chaining — a resource can have only `actions`, only `parser`/`emit`, or both at once, and neither path interferes with the other.

Three parser types are available, each producing the same shape of extracted item(s) regardless of which one is used:

- **`regex`** — applies a regular expression to the raw response body and captures a single field.
- **`json_path`** — navigates to an array within the parsed JSON body, optionally filters it, and maps selected fields into each extracted item.
- **`css`** — applies a CSS selector to an HTML response body and maps selected fields (and/or attributes) into each extracted item.

See the [Configuration File Fields](#fields) table below for the full field-by-field breakdown of `parser` and `emit`.

### Example: `json_path` extraction with `emit`

The `loot_catalog` resource below fetches a miniature catalog, extracts every `miniature`-typed item from its `bundleObjs` array, and posts each one to the `majora_api` client:

```yaml
clients:
  lootstudios:
    base_url: https://app.lootstudios.com
  majora_api:
    base_url: https://majora.example.com
    headers:
      Authorization: Bearer 

resources:
  loot_catalog:
    - url: /wp-admin/admin-ajax.php?action=GetMyLootsCache
      status: 200
      client: lootstudios
      parser:
        type: json_path
        match: bundleObjs
        filter:
          - field: obj_type
            equals: miniature
        fields:
          obj_inid: inid
          obj_title: name
          obj_post_id: post_id
          bnd_title: bundle
      emit:
        client: majora_api
        method: POST
        url: /api/miniatures
        headers:
          Authorization: Bearer $MAJORA_API_TOKEN
```

For each of the 28 matched items, Navi enqueues one `POST https://majora.example.com/api/miniatures` request with a body built from the mapped fields (`{ inid, name, post_id, bundle }`).

### Example: `regex` standalone

A `parser` doesn't need `json_path`'s nested `fields`/`filter` — a `regex` parser captures a single field directly from the raw body, useful for pulling a value out of HTML that isn't itself JSON:

```yaml
resources:
  bundle_page:
    - url: /bundle/tidal-aberrations/?logged-in
      status: 200
      client: lootstudios
      parser:
        type: regex
        match: 'postid-(\d+)'
        field: post_id
      emit:
        client: majora_api
        method: POST
        url: /api/bundles/resolve
```

Here the regex `postid-(\d+)` captures `880433` out of the response body's `postid-880433` class name, and Navi enqueues `POST https://majora.example.com/api/bundles/resolve` with `{ "post_id": "880433" }`.

### Emit retry policy

Each `EmitJob` retries independently of the global `workers.max-retries`/`workers.retry_cooldown` policy: **5 retries, 5000ms cooldown between attempts** by default, since external endpoints are more likely to be transiently flaky than Navi's own crawl targets. Override either value per resource via `emit.retries`/`emit.cooldown` (see the Fields table above). An `EmitJob` retries on any `5xx`, `429`, `408`, or network-level (no response) failure; any other `4xx` dead-letters immediately, since those represent bad requests/config/auth issues that won't resolve by waiting. A `429` response honors a `Retry-After` header (capped at 60 seconds) instead of the normal cooldown; a malformed or missing value falls back to the normal cooldown.

### Tracking extraction and emission

Navi tracks every extraction run and emission attempt in memory, exposed through two unauthenticated `GET` endpoints alongside the monitoring web UI:

- **`GET /extractions.json`** — returns `{ counts, extractions }`. `counts` is `{ extracted }`, the monotonic total number of items produced across every `ExtractionJob` run (exact even past ring-buffer eviction). `extractions` is a page of records — one per `ExtractionJob` run, not per item — each shaped `{ id, parserType, originUrl, itemCount, timestamp }`.
- **`GET /emissions.json`** — returns `{ counts, emissions }`. `counts` is `{ extracted, emitted, failed, dead }`. `emissions` is a page of records, each shaped `{ id, extractionId, status, url, method, httpStatus, error, itemRef, timestamp }`, where `status` is one of `success`/`failed`/`dead` and `extractionId` links back to the `GET /extractions.json` record whose items produced it (`null` when it can't be traced).

Both endpoints page with a `?last_id=<id>` cursor and cap each page at `web.logs_page_size` records (default `20`, shared with `/logs.json`), ordered oldest-first. Their underlying ring buffers are sized independently via the top-level `emit.size` / `extraction.size` config keys (default `100` each, see the Fields table above); the counters themselves stay exact for the whole run regardless of ring-buffer eviction. `GET /stats.json` also summarizes the same counters under its `emissions` key. All of this data resets when the engine stops, the same as the log buffers.

See [`docs/agents/future/crawler/flows.md`](https://github.com/darthjee/navi/blob/main/docs/agents/future/crawler/flows.md) for further worked examples, including how extraction/emit interacts with `paginated_actions`.

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
  autostart: true # optional, defaults to true
```

By default, the engine starts processing jobs immediately at boot. Setting `autostart: false` boots the web server without starting the engine — job processing stays paused until an operator calls `PATCH /engine/start` (optionally with a `{ "resources": [...] }` body naming which configured resources to enqueue).

When enabled, the UI is accessible at `http://localhost:<port>` and includes the following screens:

**Dashboard (`/#/`)** — displays the real-time state of all job queues:

- Jobs currently in queue.
- Jobs being processed.
- Finished jobs.
- Failed jobs (with last failure reason).
- Dead jobs (exceeded retry limit).

**Jobs list (`/#/jobs`)** — shows a table of all jobs across every status, with links to each job's detail page.

**Job detail (`/#/job/:id`)** — shows the full details of a specific job (ID, status, and attempt count).

**Memory status (`/#/memory/status`)** — shows current process memory usage against the resolved maximum, color-coded by status:

- Current vs. maximum usage, formatted (e.g. `512 MB / 2 GB`).
- Usage percentage.
- Status label (`low`/`medium`/`high`/`over`), colored per status — a distinct color when usage exceeds 100% of the maximum.

**Extractions (`/#/extractions`)** — shows a table of `ExtractionJob` runs (parser type, origin URL, item count, timestamp), each linked to the emissions it produced, with a running `extracted` total.

**Emissions (`/#/emissions`)** — shows a table of individual `EmitJob` emissions (status, target URL/method, HTTP status, error when failed/dead, linked extraction, timestamp), with running `extracted`/`emitted`/`failed`/`dead` totals.

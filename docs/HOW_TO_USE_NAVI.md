# How to Use Navi

[Navi](https://github.com/darthjee/navi) is a queue-based cache-warmer written in Node.js.
It reads a YAML configuration file and performs HTTP requests concurrently using a configurable worker pool, with support for resource chaining and automatic retry of failed requests.

This guide is intended for developers and AI agents who want to integrate Navi as a cache-warmer into their own projects or CI/CD pipelines.
Two integration modes are covered:

- **Option A** — use the `darthjee/navi-hey` Docker image directly in a CI step.
- **Option B** — install the `navi-hey` npm package in a Node.js-capable CI image and run it from the command line.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Option A — Docker image (`darthjee/navi-hey`)](#option-a--docker-image-darthjee-navi-hey)
- [Option B — Node.js image with `navi-hey` installed](#option-b--nodejs-image-with-navi-hey-installed)
- [Reference](#reference)

---

## Prerequisites

### Navi configuration file

Both options require a YAML configuration file that tells Navi which URLs to warm.
Create a file (e.g. `navi_config.yml`) with at least a `clients` and a `resources` section.
**Omit the `web:` key** to run Navi in headless mode (no web server), which is the right choice for CI pipelines.

```yaml
workers:
  quantity: 5          # number of concurrent workers (default: 1)
  retry_cooldown: 2000 # ms before a failed job is retried (default: 2000)
  max-retries: 3       # max retries before a job is marked dead (default: 3)

clients:
  default:
    base_url: https://your-app.example.com
    timeout: 5000      # ms before the request times out (default: 5000)

resources:
  pages:
    - url: /
      status: 200
    - url: /about
      status: 200
  products:
    - url: /products.json
      status: 200
      actions:
        - resource: product_detail
          parameters:
            id: parsed_body.id   # extract "id" from each response item
  product_detail:
    - url: /products/{:id}.json
      status: 200
```

Key points:

| Field | Description |
|-------|-------------|
| `workers.quantity` | Number of parallel workers. Defaults to `1`. |
| `clients.<name>.base_url` | Base URL prepended to every resource URL. |
| `clients.<name>.headers` | Optional headers sent with every request. Values support `$VAR` / `${VAR}` environment variable references. |
| `resources.<name>` | A named group of URLs to warm. |
| `url` | URL path appended to `base_url`. Supports `{:placeholder}` tokens. |
| `status` | Expected HTTP status code. Requests returning a different code are retried. |
| `actions[].resource` | Resource to enqueue after a successful response (resource chaining). |
| `actions[].parameters` | Path expressions that extract values from the response (e.g. `parsed_body.id`, `headers['x-next-page']`). |

---

## Option A — Docker image (`darthjee/navi-hey`)

Use this option when your CI environment supports Docker.
Mount your configuration file into the container and run Navi headlessly.

### GitHub Actions

```yaml
jobs:
  warm-cache:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Warm cache with Navi
        run: |
          docker run --rm \
            -v ${{ github.workspace }}/navi_config.yml:/home/node/app/config/navi_config.yml \
            darthjee/navi-hey:latest \
            node navi.js --config config/navi_config.yml
```

### CircleCI

```yaml
jobs:
  warm-cache:
    docker:
      - image: cimg/base:current
    steps:
      - checkout
      - setup_remote_docker
      - run:
          name: Warm cache with Navi
          command: |
            docker run --rm \
              -v $(pwd)/navi_config.yml:/home/node/app/config/navi_config.yml \
              darthjee/navi-hey:latest \
              node navi.js --config config/navi_config.yml
```

The container exits with a non-zero code if any request ultimately fails after all retries, which causes the CI step to fail.

---

## Option B — Node.js image with `navi-hey` installed

Use this option when your CI environment already provides a Node.js runtime and you prefer not to use Docker-in-Docker.

### Install and run with npx (no prior install needed)

```bash
npx navi-hey --config path/to/navi_config.yml
```

### Install globally and run

```bash
# npm
npm install -g navi-hey

# yarn
yarn global add navi-hey

navi-hey --config path/to/navi_config.yml
```

### GitHub Actions example

```yaml
jobs:
  warm-cache:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Warm cache with Navi
        run: npx navi-hey --config navi_config.yml
```

### CircleCI example

```yaml
jobs:
  warm-cache:
    docker:
      - image: cimg/node:20.0
    steps:
      - checkout
      - run:
          name: Warm cache with Navi
          command: npx navi-hey --config navi_config.yml
```

---

## Reference

### CLI flags

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--config=<path>` | `-c <path>` | `config/navi_config.yml` | Path to the YAML configuration file. |

### Environment variables in headers

Header values in the configuration file support environment variable substitution at load time:

```yaml
clients:
  auth_api:
    base_url: https://api.example.com
    headers:
      Authorization: Bearer $API_TOKEN
      X-Tenant: ${TENANT_ID}
```

Pass the variables to the process in the usual way for your environment (e.g. `env` in Docker, `environment` in GitHub Actions / CircleCI).

### Headless vs. web UI mode

Navi can optionally serve a real-time monitoring web UI. To enable it, add a `web:` section to your configuration:

```yaml
web:
  port: 3000   # omit this section entirely to run headlessly
```

For CI pipelines, omit the `web:` key so that Navi exits automatically once all jobs are processed.

# Startup and Configuration

## Startup

```
source/bin/navi.js
  └─ ArgumentsParser.parse()          — --config / -c → configPath
  └─ Application.loadConfig(configPath)
       ├─ Config  ──── clients + resources + workers + web + log
       │    ├─ ClientRegistry    (named HTTP clients)
       │    ├─ ResourceRegistry  (named resource groups)
       │    ├─ WorkersConfig     (pool size + retry cooldown + sleep + max-retries)
       │    ├─ WebConfig         (web server port — optional)
       │    └─ LogConfig         (log buffer size — optional)
       ├─ JobFactory.build()     — registers 5 job factories
       ├─ JobRegistry.build()    — singleton: enqueued / processing / failed /
       │                                       retryQueue / finished / dead
       └─ WorkersRegistry.build() + initWorkers()
            └─ WorkerFactory → Worker[]  (all start idle)
  └─ Application.run()
       ├─ buildEngine()          — Engine + WorkersAllocator
       ├─ buildWebServer()       — WebServer (null if web: absent)
       ├─ enqueueFirstJobs()     — parameter-free ResourceRequests → JobRegistry
       ├─ webServer?.start()     — Express on configured port
       └─ engine.start()         — allocation loop
```

---

## Configuration Structure

```yaml
workers:
  quantity: 5          # concurrent workers (default: 1)
  retry_cooldown: 2000 # ms before a failed job is retried (default: 2000)
  sleep: 500           # ms between allocation ticks (default: 500)
  max-retries: 3       # retries before a job is marked dead (default: 3)

log:
  size: 100            # max log entries in memory (default: 100)

web:
  port: 3000           # port for the monitoring web UI (omit to disable)
  autostart: true      # whether the engine starts processing immediately at boot (default: true)

failure:
  threshold: 10.0      # exit non-zero if more than 10% of jobs are dead (optional)

clients:
  default:
    base_url: https://example.com
    linkText: Main Website   # optional; used by GET /links.json (defaults to client key)
    timeout: 5000            # optional; ms (default: 5000)
  auth_api:
    base_url: https://api.example.com
    headers:
      Authorization: Bearer <token>

resources:
  categories:
    - url: /categories.json
      status: 200
      actions:
        - resource: category_information  # no parameters → all fields pass through
        - resource: products
          parameters:
            category_id: parsedBody.id   # extract "id" from parsed body
      paginated_actions:
        - resource: products_page
          pagination:
            - pages: parsedBody.pagination.pages
            - page_key: page
            - zero_indexed: false
  category_information:
    - url: /categories/{:id}.json
      status: 200
      client: auth_api
  products:
    - url: /categories/{:category_id}/products.json
      status: 200
  home_page:
    - url: /
      status: 200
      assets:
        - selector: 'link[rel="stylesheet"]'
          attribute: href
          status: 200
        - selector: 'script[src]'
          attribute: src
```

> **Path expression namespace: `parsedBody` is camelCase.**
> Always write `parsedBody.field` — never `parsed_body.field`. Valid namespaces: `parsedBody`, `headers`, `parameters`.
>
> **Header names are always lowercase.**
> Node.js normalizes HTTP response header names to lowercase before they reach Navi. Always use lowercase when referencing headers (e.g. `headers['x-total-pages']`, not `headers['X-Total-Pages']`).

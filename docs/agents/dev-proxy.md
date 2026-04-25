# Dev Proxy

> **Note:** There are two separate Tent-powered proxies in this project — `navi_proxy` and `navi_web_proxy`. This document covers `navi_proxy`, which is dedicated to cache-warming tests. For the web proxy that routes browser traffic to Vite or Navi, see issue [#137](https://github.com/darthjee/navi/issues/137) and the `navi_web_proxy` service in `docker-compose.yml`.

The dev proxy (`navi_proxy`) is a [Tent](https://github.com/darthjee/tent)-powered reverse proxy that sits between Navi and the dev application during local development. It gives Navi a realistic target: an HTTP endpoint that caches responses to disk, so the full cache-warming cycle can be exercised in a controlled environment.

This is precisely how Navi's cache warm-up is tested locally. Navi issues requests to the proxy, the proxy forwards them to the dev app on first contact and caches the responses, and subsequent requests are served from cache. After running Navi, you can inspect `docker_volumes/proxy_cache/` on the host to confirm which endpoints were warmed — each cache file corresponds to a URI that Navi successfully pre-fetched.

For a full reference on how Tent works, see [docs/HOW_TO_USE_DARTHJEE-TENT.md](../HOW_TO_USE_DARTHJEE-TENT.md).

---

## Role in the architecture

```
navi_app ──► navi_proxy (tent, :3010) ──► navi_dev_app (:3020/:80)
```

- `navi_app` connects to the proxy via the Docker link alias `remote_host`.
- `navi_proxy` forwards requests to `navi_dev_app` via the Docker link alias `backend`.
- Tent caches successful responses to disk so repeated Navi requests are served from cache rather than hitting the backend again.

---

## Docker Compose services

From `docker-compose.yml`:

```yaml
navi_proxy:
  image: darthjee/tent:0.5.0
  depends_on: [navi_dev_app]
  links:
    - navi_dev_app:backend
  volumes:
    - ./dev/proxy:/var/www/html/configuration/
    - ./docker_volumes/proxy_cache:/var/www/html/cache/
  ports:
    - 0.0.0.0:3010:80

navi_app:
  ...
  links:
    - navi_proxy:remote_host
```

| Mount | Purpose |
|-------|---------|
| `./dev/proxy` → `/var/www/html/configuration/` | PHP rule files that define routing behaviour |
| `./docker_volumes/proxy_cache` → `/var/www/html/cache/` | File cache written by `FileCacheMiddleware` |

The proxy is reachable from the host at `http://localhost:3010` and from `navi_app` at `http://remote_host`.

---

## Configuration files

### `dev/proxy/configure.php`

Entry point loaded by Tent at boot. Its only job is to include the rule files:

```php
<?php

require_once __DIR__ . '/rules/backend.php';
require_once __DIR__ . '/rules/frontend.php';
```

### `dev/proxy/rules/backend.php`

Defines a routing rule that forwards `.json` `GET` requests to the backend and caches the responses:

```php
Configuration::buildRule([
    'handler' => [
        'type' => 'default_proxy',
        'host' => 'http://backend:80'
    ],
    'matchers' => [
        ['method' => 'GET', 'uri' => '.json', 'type' => 'ends_with']
    ]
]);
```

- **`default_proxy`** — forwards the request to `http://backend:80` (the `navi_dev_app` container), automatically handles the `Host` header, and enables `FileCacheMiddleware` with the default cache directory (`./cache`, which resolves to the mounted `docker_volumes/proxy_cache`).
- **Matcher** — `ends_with .json` matches all JSON API requests, so only API traffic is proxied and cached.

### `dev/proxy/rules/frontend.php`

Defines two rules for serving the React SPA from `dev/proxy/static/`. With hash-based routing,
the hash fragment (`#/...`) is never sent to the server, so the proxy only needs to handle `GET /`
(the SPA entry point) and static asset requests:

```php
// Serve index.html for the SPA entry point
Configuration::buildRule([
  'handler' => [
    'type' => 'static',
    'location' => '/var/www/html/configuration/static'
  ],
  'matchers' => [
    ['method' => 'GET', 'uri' => '/', 'type' => 'exact'],
  ],
  "middlewares" => [
    [
      'class' => 'Tent\Middlewares\SetPathMiddleware',
      'path' => '/index.html'
    ]
  ]
]);

// Serve static assets (JS, CSS bundles, etc.)
Configuration::buildRule([
  'handler' => [
    'type' => 'static',
    'location' => '/var/www/html/configuration/static'
  ],
  'matchers' => [
    ['method' => 'GET', 'uri' => '/', 'type' => 'begins_with']
  ]
]);
```

- **`static` with `SetPathMiddleware`** — rewrites the path to `/index.html` and serves it from `dev/proxy/static/`, used for the exact `/` match (SPA entry point).
- **`static` (begins_with)** — serves compiled JS/CSS bundles and any other static assets directly from `dev/proxy/static/`.

No path-based frontend routes need to be handled by the server because all client-side navigation
uses hash fragments, which are processed entirely by the browser.

### `dev/proxy/static/`

Output directory where the React build artifacts are placed. The `navi_dev_frontend` Docker service mounts this directory as its Vite build output (`dist/`), so the proxy always serves the latest build.

---

## Request flow

1. Navi or a browser issues a `GET` request to `http://remote_host` (the proxy).
2. Tent evaluates rules in order:
   - If the URI ends with `.json` → **backend rule**: check cache, forward to `navi_dev_app` on miss.
   - If the URI is exactly `/` → **frontend entry point rule**: serve `index.html` (the SPA entry point).
   - Otherwise → **frontend asset rule**: serve the requested static file (JS/CSS bundle) from `dev/proxy/static/`.
3. Hash fragments (`#/...`) are never sent to the server — the browser handles all client-side navigation locally after loading `index.html`.
4. For backend requests, on a cache miss, if the backend returns a `2xx` response, Tent writes it to `docker_volumes/proxy_cache/` for subsequent requests.
5. The response is returned to the caller.

---

## Cache

Cache files are stored in `docker_volumes/proxy_cache/` on the host (mounted into the container at `./cache`). They are named from a hash of the request URI.

There is no built-in expiry. To reset the cache between test runs, delete the files:

```bash
rm -rf docker_volumes/proxy_cache/*
```

---

## How to extend the proxy configuration

### Add a rule for a new URI pattern

Edit `dev/proxy/rules/backend.php` and add a new `Configuration::buildRule()` call. Rules are evaluated top-to-bottom; place more specific matchers before catch-all ones.

Example — disable caching for a specific endpoint:

```php
// No cache for the items endpoint
Configuration::buildRule([
    'handler' => [
        'type'  => 'default_proxy',
        'host'  => 'http://backend:80',
        'cache' => false
    ],
    'matchers' => [
        ['method' => 'GET', 'uri' => '/categories/1/items.json', 'type' => 'exact']
    ]
]);

// Cache everything else
Configuration::buildRule([
    'handler' => [
        'type' => 'default_proxy',
        'host' => 'http://backend:80'
    ],
    'matchers' => [
        ['method' => 'GET', 'uri' => '/', 'type' => 'begins_with']
    ]
]);
```

### Add a new rule file

1. Create `dev/proxy/rules/my_rules.php`.
2. Add `require_once __DIR__ . '/rules/my_rules.php';` to `dev/proxy/configure.php`.

---

## Docker Compose dependency chain

```
navi_app ──depends_on──► navi_proxy ──depends_on──► navi_dev_app
                                     ──depends_on──► navi_dev_frontend
```

`navi_proxy` will not start until both `navi_dev_app` and `navi_dev_frontend` are up, and `navi_app` will not start until `navi_proxy` is up.

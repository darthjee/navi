# Plan: Add Cache for Dev Frontend Requests

## Overview

Add `Tent\Middlewares\FileCacheMiddleware` to both frontend rules in `dev/proxy/rules/frontend.php` so that Navi can warm and verify the frontend cache in the development environment.

## Context

The dev proxy (`navi_proxy`) currently caches backend JSON responses via the `default_proxy` handler (which includes `FileCacheMiddleware` automatically). Frontend rules use the `static` handler, which serves files from disk directly with no caching layer. This means Navi cannot be used to test frontend cache warm-up: there is no cache to inspect after Navi runs.

`FileCacheMiddleware` works with any handler type — it intercepts requests before they reach the handler. On a cache miss the handler runs and the response is written to disk; on a subsequent request the cached file is served directly, bypassing the handler entirely. This makes it suitable for `static` rules too.

## Implementation Steps

### Step 1 — Add `FileCacheMiddleware` to the SPA entry point rule (exact `GET /`)

`FileCacheMiddleware` must be placed **first** in the middleware list, before `SetPathMiddleware`. This ensures the cache key is `/` (the URI Navi requests), not `/index.html` (the rewritten path used by the handler).

**Current code (`dev/proxy/rules/frontend.php:8`):**

```php
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
    ],
    ['class' => 'Dev\\Proxy\\Middlewares\\DelayMiddleware']
  ]
]);
```

**After change:**

```php
Configuration::buildRule([
  'handler' => [
    'type' => 'static',
    'location' => '/var/www/html/configuration/static'
  ],
  'matchers' => [
    ['method' => 'GET', 'uri' => '/', 'type' => 'exact'],
  ],
  'middlewares' => [
    [
      'class' => 'Tent\Middlewares\FileCacheMiddleware',
      'location' => './cache',
      'matchers' => [
        [
          'class' => 'Tent\Matchers\StatusCodeMatcher',
          'httpCodes' => ['2xx', '3xx']
        ]
      ]
    ],
    [
      'class' => 'Tent\Middlewares\SetPathMiddleware',
      'path' => '/index.html'
    ],
    ['class' => 'Dev\\Proxy\\Middlewares\\DelayMiddleware']
  ]
]);
```

**Request flow after the change:**
1. Navi requests `GET /` → `FileCacheMiddleware` checks cache for key `/` → miss.
2. `SetPathMiddleware` rewrites path to `/index.html`.
3. `static` handler serves `/index.html`.
4. `FileCacheMiddleware` writes the response to `./cache` under key `/`.
5. Next request `GET /` → `FileCacheMiddleware` finds cache hit → serves from cache, bypassing the handler.

### Step 2 — Add `FileCacheMiddleware` to the static assets rule (begins_with `GET /`)

Same approach: `FileCacheMiddleware` is placed first, before `DelayMiddleware`.

**Current code (`dev/proxy/rules/frontend.php:25`):**

```php
Configuration::buildRule([
  'handler' => [
    'type' => 'static',
    'location' => '/var/www/html/configuration/static'
  ],
  'matchers' => [
    ['method' => 'GET', 'uri' => '/', 'type' => 'begins_with']
  ],
  'middlewares' => [
    ['class' => 'Dev\\Proxy\\Middlewares\\DelayMiddleware']
  ]
]);
```

**After change:**

```php
Configuration::buildRule([
  'handler' => [
    'type' => 'static',
    'location' => '/var/www/html/configuration/static'
  ],
  'matchers' => [
    ['method' => 'GET', 'uri' => '/', 'type' => 'begins_with']
  ],
  'middlewares' => [
    [
      'class' => 'Tent\Middlewares\FileCacheMiddleware',
      'location' => './cache',
      'matchers' => [
        [
          'class' => 'Tent\Matchers\StatusCodeMatcher',
          'httpCodes' => ['2xx', '3xx']
        ]
      ]
    ],
    ['class' => 'Dev\\Proxy\\Middlewares\\DelayMiddleware']
  ]
]);
```

**Request flow after the change:**
1. Navi requests `GET /assets/app.js` → `FileCacheMiddleware` checks cache → miss.
2. `static` handler serves the file.
3. `FileCacheMiddleware` writes the response to `./cache` under key `/assets/app.js`.
4. Next request `GET /assets/app.js` → served from cache.

### Step 3 — Add `cacheCodes: ['2xx', '3xx']` to both backend rules

The `default_proxy` handler includes `FileCacheMiddleware` automatically, but defaults to caching only `2xx` responses. Adding the `cacheCodes` option extends caching to also cover 3xx redirect responses.

**Current code (`dev/proxy/rules/backend.php:9`):**

```php
Configuration::buildRule([
    'handler' => [
        'type' => 'default_proxy',
        'host' => 'http://backend:80'
    ],
    'matchers' => [
        ['method' => 'GET', 'uri' => '.json', 'type' => 'ends_with']
    ],
    'middlewares' => [
        ['class' => 'Dev\\Proxy\\Middlewares\\RandomFailureMiddleware'],
        ['class' => 'Dev\\Proxy\\Middlewares\\DelayMiddleware']
    ]
]);

Configuration::buildRule([
    'handler' => [
        'type' => 'default_proxy',
        'host' => 'http://backend:80'
    ],
    'matchers' => [
        ['method' => 'GET', 'uri' => '/categories', 'type' => 'begins_with']
    ],
    'middlewares' => [
        ['class' => 'Dev\\Proxy\\Middlewares\\DelayMiddleware']
    ]
]);
```

**After change:**

```php
Configuration::buildRule([
    'handler' => [
        'type'       => 'default_proxy',
        'host'       => 'http://backend:80',
        'cacheCodes' => ['2xx', '3xx']
    ],
    'matchers' => [
        ['method' => 'GET', 'uri' => '.json', 'type' => 'ends_with']
    ],
    'middlewares' => [
        ['class' => 'Dev\\Proxy\\Middlewares\\RandomFailureMiddleware'],
        ['class' => 'Dev\\Proxy\\Middlewares\\DelayMiddleware']
    ]
]);

Configuration::buildRule([
    'handler' => [
        'type'       => 'default_proxy',
        'host'       => 'http://backend:80',
        'cacheCodes' => ['2xx', '3xx']
    ],
    'matchers' => [
        ['method' => 'GET', 'uri' => '/categories', 'type' => 'begins_with']
    ],
    'middlewares' => [
        ['class' => 'Dev\\Proxy\\Middlewares\\DelayMiddleware']
    ]
]);
```

## Files to Change

- `dev/proxy/rules/frontend.php` — add `FileCacheMiddleware` (caching `2xx` and `3xx`) to both frontend rules.
- `dev/proxy/rules/backend.php` — add `cacheCodes: ['2xx', '3xx']` to both backend `default_proxy` rules.

## Notes

- The cache directory `./cache` is the same used by the backend rules. Since cache keys are derived from the request URI, there is no risk of collision between backend and frontend entries (backend URIs end in `.json` or start with `/categories`; frontend URIs are `/` or `/assets/*`).
- Cache files accumulate in `docker_volumes/proxy_cache/` on the host. After running Navi, you can inspect that directory to confirm which frontend assets were warmed — each file corresponds to a URI that Navi successfully pre-fetched.
- To reset the cache between test runs: `rm -rf docker_volumes/proxy_cache/*`.
- This change is scoped to `dev/proxy` only and has no effect on production.

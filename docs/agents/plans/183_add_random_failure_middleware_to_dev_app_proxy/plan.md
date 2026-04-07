# Plan: Add Random Failure Middleware to Dev App Proxy

## Overview

Add a custom PHP middleware to the Tent-powered dev proxy (`navi_proxy`) that randomly returns `502 Bad Gateway` at a configurable probability. The failure rate is controlled by a `FAILURE_RATE` environment variable (float 0–1) passed to the container. When absent or `0`, all requests pass through normally.

## Context

- The dev proxy lives in `dev/proxy/` and is mounted into the `darthjee/tent:0.5.0` container at `/var/www/html/configuration/`.
- Tent loads `dev/proxy/configure.php` at boot, which currently only includes `dev/proxy/rules/backend.php`.
- Tent middlewares are PHP classes referenced by fully-qualified class name in the rule config. Tent instantiates them at request time with the parameters from the config array.
- Environment variables can be read inside PHP rule files via `getenv()`.
- `docker-compose.yml` does not currently pass any environment variables to `navi_proxy`.

## Implementation Steps

### Step 1 — Create the custom middleware class

Create `dev/proxy/middlewares/RandomFailureMiddleware.php`. All Tent middlewares extend the abstract `Middleware` base class and override `processRequest`. To short-circuit the chain, create a `Response` object and attach it to the request via `$request->setResponse()` — Tent will then skip the backend call and return that response directly.

The class also needs a static `build(array $attributes): self` factory method, which Tent calls to instantiate the middleware from the config array.

```php
<?php

namespace Dev\Proxy\Middlewares;

use Tent\Middlewares\Middleware;
use Tent\Models\ProcessingRequest;
use Tent\Models\Response;

class RandomFailureMiddleware extends Middleware
{
    public static function build(array $attributes): self
    {
        return new self();
    }

    public function processRequest(ProcessingRequest $request): ProcessingRequest
    {
        $rate = (float) (getenv('FAILURE_RATE') ?: 0);

        if ($rate > 0 && lcg_value() < $rate) {
            $response = new Response([
                'httpCode' => 502,
                'body'     => 'Bad Gateway'
            ]);
            $request->setResponse($response);
        }

        return $request;
    }
}
```

### Step 2 — Register the middleware in the proxy configuration

In `dev/proxy/configure.php`, require the new middleware file before the rules:

```php
<?php

require_once __DIR__ . '/middlewares/RandomFailureMiddleware.php';
require_once __DIR__ . '/rules/backend.php';
```

In `dev/proxy/rules/backend.php`, add the middleware to the rule (listed **before** the default proxy middlewares so failures short-circuit before any backend contact):

```php
Configuration::buildRule([
    'handler' => [
        'type' => 'default_proxy',
        'host' => 'http://backend:80'
    ],
    'matchers' => [
        ['method' => 'GET', 'uri' => '/', 'type' => 'begins_with']
    ],
    'middlewares' => [
        ['class' => 'Dev\Proxy\Middlewares\RandomFailureMiddleware']
    ]
]);
```

### Step 3 — Expose the environment variable in docker-compose.yml

Add an `environment` (or `env_file`) block to the `navi_proxy` service so `FAILURE_RATE` is passed into the container. Defaulting to `0` means no failures unless explicitly set:

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
  environment:
    FAILURE_RATE: ${FAILURE_RATE:-0}
```

## Files to Change

- `dev/proxy/middlewares/RandomFailureMiddleware.php` — new custom middleware class (to be created)
- `dev/proxy/configure.php` — add `require_once` for the new middleware file
- `dev/proxy/rules/backend.php` — register `RandomFailureMiddleware` in the rule's `middlewares` array
- `docker-compose.yml` — expose `FAILURE_RATE` env var to `navi_proxy`

## CI Checks

The changes are in `dev/proxy/` (PHP/config) and `docker-compose.yml`. No CI job covers these files directly — there are no PHP tests. Manual verification is done by running the proxy locally and confirming that:

```bash
FAILURE_RATE=1.0 docker-compose up navi_proxy
# All requests should return 502

FAILURE_RATE=0 docker-compose up navi_proxy
# All requests should pass through normally
```

## Notes

- The `FAILURE_RATE` env var is evaluated at request time (inside the middleware `processRequest`), not at boot time, so it correctly applies per-request randomness.
- Cache interactions: a `502` returned by this middleware should **not** be cached, since caching a failure would persist it across retries. Confirm that `FileCacheMiddleware` (added automatically by `default_proxy`) does not cache non-2xx responses — the default `cacheCodes: ['2xx']` confirms it will not.

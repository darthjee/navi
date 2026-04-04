# Plan: Add Proxy for Frontend Development

## Overview

Add a new Tent-powered Docker service (`navi_web_proxy`) that acts as the single web entry point for the Navi application. It routes traffic to either the Vite dev server (`navi_frontend`) or Navi itself (`navi_app`) depending on the `FRONTEND_DEV_MODE` environment variable. No caching is involved — this proxy does routing only.

---

## Context

- The existing `navi_proxy` (port `3010`) is used exclusively for cache-warming tests: it sits in front of `navi_dev_app` and caches responses. It is unrelated to this issue.
- `navi_frontend` is a Vite app running on port `8080` inside its container (configured in `frontend/vite.config.js`).
- `navi_app` is the Navi application container, capable of serving compiled frontend static files.
- The `darthjee/tent:0.5.0` image is already in use in the project; the same version will be used here.
- No cache volume is needed since this proxy must not cache any responses. The `proxy` handler type (not `default_proxy`) is used so that `FileCacheMiddleware` is never added automatically.

---

## Implementation Steps

### Step 1 — Create `dev/web_proxy/configure.php`

Entry point loaded by Tent. Its only job is to include the frontend rule file:

```php
<?php

use Tent\Configuration;
use Tent\Handlers\ProxyRequestHandler;
use Tent\Models\Server;
use Tent\Models\RequestMatcher;

require_once __DIR__ . '/rules/frontend.php';
```

### Step 2 — Create `dev/web_proxy/rules/frontend.php`

Routing rules controlled by `FRONTEND_DEV_MODE`. Uses the `proxy` handler (no cache) in both branches.

**`FRONTEND_DEV_MODE=true`** — forward all Vite-related paths to `navi_frontend` (port `8080`):

```php
<?php

use Tent\Configuration;

if (getenv('FRONTEND_DEV_MODE') === 'true') {
    Configuration::buildRule([
        'handler' => [
            'type' => 'proxy',
            'host' => 'http://frontend:8080'
        ],
        'matchers' => [
            ['method' => 'GET', 'uri' => '/',              'type' => 'exact'],
            ['method' => 'GET', 'uri' => '/assets/js/',    'type' => 'begins_with'],
            ['method' => 'GET', 'uri' => '/assets/css/',   'type' => 'begins_with'],
            ['method' => 'GET', 'uri' => '/@vite/',        'type' => 'begins_with'],
            ['method' => 'GET', 'uri' => '/node_modules/', 'type' => 'begins_with'],
            ['method' => 'GET', 'uri' => '/@react-refresh','type' => 'exact']
        ]
    ]);
} else {
    Configuration::buildRule([
        'handler' => [
            'type' => 'proxy',
            'host' => 'http://backend:80'
        ],
        'matchers' => [
            ['method' => 'GET', 'uri' => '/', 'type' => 'begins_with']
        ]
    ]);
}
```

The `else` branch routes everything to `navi_app` (aliased as `backend`), which serves the compiled frontend.

### Step 3 — Add `navi_web_proxy` to `docker-compose.yml`

```yaml
navi_web_proxy:
  image: darthjee/tent:0.5.0
  depends_on: [navi_app, navi_frontend]
  links:
    - navi_app:backend
    - navi_frontend:frontend
  env_file: .env
  volumes:
    - ./dev/web_proxy:/var/www/html/configuration/
  ports:
    - 0.0.0.0:3030:80
```

- Links `navi_app` as `backend` and `navi_frontend` as `frontend` to match the aliases used in the rule file.
- Receives `FRONTEND_DEV_MODE` from the shared `.env` file.
- No cache volume — this proxy does not persist anything to disk.

### Step 4 — Add `FRONTEND_DEV_MODE` to `.env.sample`

Add the variable with a comment so developers know to set it:

```
FRONTEND_DEV_MODE=false
```

### Step 5 — Update `docs/agents/dev-proxy.md`

Add a note clarifying that `navi_web_proxy` is a separate concern from `navi_proxy`, to avoid confusion between the two Tent containers.

---

## Files to Change

| File | Change |
|------|--------|
| `dev/web_proxy/configure.php` | **Create** — Tent entry point, includes `rules/frontend.php` |
| `dev/web_proxy/rules/frontend.php` | **Create** — routing rules gated on `FRONTEND_DEV_MODE` |
| `docker-compose.yml` | **Edit** — add `navi_web_proxy` service |
| `.env.sample` | **Edit** — add `FRONTEND_DEV_MODE=false` |
| `docs/agents/dev-proxy.md` | **Edit** — note that this proxy is different from `navi_web_proxy` |

---

## Notes

- `proxy` handler is used instead of `default_proxy` in both branches to guarantee no caching is ever applied. `default_proxy` adds `FileCacheMiddleware` by default, which is not wanted here.
- The Vite dev server needs `/@vite/` and `/@react-refresh` to be forwarded for HMR to work; missing these paths will break hot reload silently in the browser.
- `navi_frontend` listens on port `8080` (set in `frontend/vite.config.js`).
- There is no need to fix the `Host` header for the Vite dev server — Vite does not restrict routing by `Host`.

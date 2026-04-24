# Plan: Proxy Configuration

The dev proxy is powered by **Tent** (`darthjee/tent:0.5.0`). Its configuration lives in `dev/proxy/` and is mounted into the container at `/var/www/html/configuration/`.

## Current state

`dev/proxy/rules/backend.php` routes **all** GET requests to `dev/app`:

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
        ['class' => 'Dev\\Proxy\\Middlewares\\RandomFailureMiddleware']
    ]
]);
```

## Changes

### 1 — Restrict `backend.php` to `.json` requests only

Change the matcher so only `.json` URIs are forwarded to the backend:

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
        ['class' => 'Dev\\Proxy\\Middlewares\\RandomFailureMiddleware']
    ]
]);
```

### 2 — Add `dev/proxy/rules/frontend.php`

New rule file with two rules:

**Rule A — Serve static files from `dev/proxy/static/`:**

```php
Configuration::buildRule([
    'handler' => [
        'type' => 'static_file',
        'folder' => '/var/www/html/configuration/static'
    ],
    'matchers' => [
        ['method' => 'GET', 'uri' => '/', 'type' => 'begins_with']
    ]
]);
```

**Rule B — SPA fallback: serve `index.html` for unmatched paths:**

```php
Configuration::buildRule([
    'handler' => [
        'type' => 'fixed_file',
        'file' => '/var/www/html/configuration/static/index.html'
    ],
    'matchers' => [
        ['method' => 'GET', 'uri' => '/', 'type' => 'begins_with']
    ]
]);
```

> Rule ordering matters: `backend.php` (`.json`) is evaluated first, then `frontend.php` (static → fallback). Tent evaluates rules in the order they are required in `configure.php`.

### 3 — Update `configure.php`

Add `require_once` for the new rules file, after the backend rule:

```php
require_once __DIR__ . '/middlewares/RandomFailureMiddleware.php';
require_once __DIR__ . '/rules/backend.php';
require_once __DIR__ . '/rules/frontend.php';
```

## Notes

- `dev/proxy/static/` is the bind-mount target for the Vite build output. It must exist on the host before the container starts; create it as an empty directory and commit it (with a `.gitkeep`).
- The exact Tent handler type names (`static_file`, `fixed_file`) should be verified against the Tent documentation or the existing `configure.php` imports (`StaticFileHandler`, `FixedFileHandler`) before implementation.

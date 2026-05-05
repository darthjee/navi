# Dev Proxy

> **Note:** There are two proxies in this project — `navi_proxy` (this document) and `navi_web_proxy`. This covers `navi_proxy`, dedicated to cache-warming tests.

The dev proxy is a [Tent](https://github.com/darthjee/tent)-powered reverse proxy that sits between Navi and the dev application during local development. It caches responses to disk so the full cache-warming cycle can be exercised in a controlled environment.

```
navi_app ──► navi_proxy (tent, :3010) ──► navi_dev_app (:3020/:80)
```

After running Navi, inspect `docker_volumes/proxy_cache/` to confirm which endpoints were warmed — each file corresponds to a URI that Navi successfully pre-fetched.

For a full reference on how Tent works, see [docs/HOW_TO_USE_DARTHJEE-TENT.md](../HOW_TO_USE_DARTHJEE-TENT.md).

---

## Docker Compose

| Mount | Purpose |
|-------|---------|
| `./dev/proxy` → `/var/www/html/configuration/` | PHP rule files that define routing behaviour |
| `./docker_volumes/proxy_cache` → `/var/www/html/cache/` | File cache written by Tent |

The proxy is reachable from the host at `http://localhost:3010` and from `navi_app` at `http://remote_host`.

---

## Configuration files

`dev/proxy/configure.php` is the entry point, loading the middleware and rule files.

**`dev/proxy/rules/backend.php`** defines two rules:

- **`.json` (ends_with matcher)** — forwards JSON API requests to `navi_dev_app` via `default_proxy`; Tent caches successful responses. Also applies `RandomFailureMiddleware` and `DelayMiddleware`.
- **`/categories` (begins_with matcher)** — forwards plain path requests for redirect handling; no caching.

**`dev/proxy/rules/frontend.php`** defines two rules for serving the React SPA from `dev/proxy/static/`:

- **`GET /` (exact)** — rewrites path to `/index.html` via `SetPathMiddleware` and serves it. Handles all hash-based navigation since browsers strip the `#/...` fragment before sending the request.
- **`GET /` (begins_with)** — serves static assets (JS/CSS bundles) directly.

---

## Middlewares

| Middleware | Env var | Default | Description |
|-----------|---------|---------|-------------|
| `RandomFailureMiddleware` | `FAILURE_RATE` | `0` | % of requests that return 500 |
| `DelayMiddleware` | `MIN_RESPONSE_DELAY` / `MAX_RESPONSE_DELAY` | `0` / `0` | Random delay range in ms |

---

## Request flow

1. Request arrives at `http://remote_host` (the proxy).
2. Tent evaluates rules in order:
   - URI ends with `.json` → backend JSON rule: check cache, forward to `navi_dev_app` on miss.
   - URI begins with `/categories` → backend redirect rule: forward to `navi_dev_app` for 302.
   - URI is exactly `/` → serve `index.html` (SPA entry point).
   - Otherwise → serve static asset from `dev/proxy/static/`.
3. Hash fragments (`#/...`) are never sent to the server — the browser handles client-side navigation locally.
4. On a JSON cache miss, if the backend returns 2xx, Tent writes the response to `docker_volumes/proxy_cache/`.

---

## Cache

Files are stored in `docker_volumes/proxy_cache/` named from a hash of the URI. No built-in expiry.

```bash
rm -rf docker_volumes/proxy_cache/*   # reset cache between test runs
```

---

## Extending the proxy

To add a rule for a new URI pattern, add a `Configuration::buildRule()` call to `dev/proxy/rules/backend.php`. Rules are evaluated top-to-bottom; place more specific matchers before catch-all ones.

To add a new rule file, create it and add a `require_once` to `dev/proxy/configure.php`.

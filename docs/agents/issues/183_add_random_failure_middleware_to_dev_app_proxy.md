# Issue: Add Random Failure Middleware to Dev App Proxy

## Description

The dev proxy (`navi_proxy`) sits in front of `navi_dev_app` and is powered by [Tent](https://github.com/darthjee/tent). Tent supports custom middlewares. We want to simulate backend failures in the proxy layer to test Navi's retry and error-handling behaviour under realistic conditions.

## Problem

- There is currently no way to simulate intermittent backend failures in the local development environment.
- Without a failure simulation mechanism, it is difficult to test Navi's retry logic end-to-end in a controlled way.

## Expected Behavior

- A new custom Tent middleware is added to `dev/proxy/`.
- The middleware reads an environment variable (e.g. `FAILURE_RATE`) whose value is a float between `0` and `1`, representing the probability of a failure (e.g. `0.3` = 30% failure rate).
- On each request, the middleware randomly decides whether to short-circuit the request and return a `502 Bad Gateway` response, based on that probability.
- When the environment variable is absent or set to `0`, the middleware is a no-op and all requests pass through normally.

## Solution

- Create a custom PHP middleware class (e.g. `RandomFailureMiddleware`) under `dev/proxy/middlewares/` or a similar location inside the Tent configuration volume.
- The class should sample a random float and compare it against the configured failure rate to decide whether to return `502`.
- Register the middleware in `dev/proxy/rules/backend.php` using Tent's `middlewares` key.
- Pass `FAILURE_RATE` through `docker-compose.yml` (or `.env`) to the `navi_proxy` service.

## Benefits

- Enables realistic end-to-end testing of Navi's retry and cooldown behaviour without modifying the dev application.
- Controllable via a single environment variable — easy to toggle on/off or tune.

---
See issue for details: https://github.com/darthjee/navi/issues/183

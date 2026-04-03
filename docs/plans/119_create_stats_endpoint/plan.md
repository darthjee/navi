# Plan: Create Stats Endpoint

## Overview

Add an optional Express web server to Navi, configured via a `web:` key in the existing YAML config file. If the key is absent, no server starts. A single `GET /stats.json` route returns job and worker stats from the existing registries.

## Context

- The YAML config is parsed by `ConfigParser`, which already maps `workers:` into a `WorkersConfig` model. The same pattern is used here for `web:`.
- `Config` stores `workersConfig`; it will also store `webConfig` (or `null` when absent).
- `Application` owns the registries and orchestrates startup. It is the right place to conditionally start the web server.
- This feature depends on issue #118 (`JobRegistry#stats()` and `WorkersRegistry#stats()`).
- Express is not yet a dependency and must be added via `yarn add express`.

## Implementation Steps

### Step 1 — Add Express

```bash
yarn add express
```

### Step 2 — Create `source/lib/models/WebConfig.js`

A model parallel to `WorkersConfig`, reading `port` from the `web:` YAML section:

```js
class WebConfig {
  constructor({ port }) {
    this.port = port;
  }
}
```

### Step 3 — Update `ConfigParser` to parse `web:`

Add a private method `#webConfig()` that returns a `WebConfig` instance when `this.config.web` is present, or `null` otherwise. Include it in the object returned by `parse()`:

```js
parse() {
  return {
    resources:   mappedResources,
    clients:     mappedClients,
    workersConfig: this.#workersConfig(),
    webConfig:   this.#webConfig(),
  };
}

#webConfig() {
  if (!this.config.web) return null;
  return new WebConfig(this.config.web);
}
```

### Step 4 — Update `Config` to store `webConfig`

Extend the constructor to accept and store `webConfig`:

```js
constructor({ resources, clients, workersConfig, webConfig }) {
  ...
  this.webConfig = webConfig ?? null;
}
```

### Step 5 — Create the server abstractions under `source/lib/server/`

Following the same pattern used in `dev/lib/`, introduce four classes:

---

**`RequestHandler`** — base class with an empty `handle(req, res)` method to be overridden by subclasses. No constructor arguments defined at this level.

```js
class RequestHandler {
  handle(_req, _res) {}
}
```

---

**`StatsRequestHandler`** extends `RequestHandler`. Receives the two registries and implements `handle` to respond with their stats:

```js
class StatsRequestHandler extends RequestHandler {
  #jobRegistry;
  #workersRegistry;

  constructor({ jobRegistry, workersRegistry }) {
    super();
    this.#jobRegistry = jobRegistry;
    this.#workersRegistry = workersRegistry;
  }

  handle(_req, res) {
    res.json({
      jobs:    this.#jobRegistry.stats(),
      workers: this.#workersRegistry.stats(),
    });
  }
}
```

---

**`RouteRegister`** — receives an Express router and binds a route pattern to a `RequestHandler` instance:

```js
class RouteRegister {
  #router;

  constructor(router) {
    this.#router = router;
  }

  register({ route, handler }) {
    this.#router.get(route, (req, res) => handler.handle(req, res));
  }
}
```

---

**`Router`** — receives the registries, builds an Express router via `RouteRegister`, and registers all routes:

```js
class Router {
  #jobRegistry;
  #workersRegistry;

  constructor({ jobRegistry, workersRegistry }) {
    this.#jobRegistry = jobRegistry;
    this.#workersRegistry = workersRegistry;
  }

  build() {
    const router = ExpressRouter();
    const register = new RouteRegister(router);

    register.register({
      route:   '/stats.json',
      handler: new StatsRequestHandler({
        jobRegistry:     this.#jobRegistry,
        workersRegistry: this.#workersRegistry,
      }),
    });

    return router;
  }
}
```

---

**`WebServer`** — uses `Router` to set up the Express app. Includes a static `build()` that encapsulates the conditional logic (returns `null` when `webConfig` is absent):

```js
class WebServer {
  #port;
  #app;

  constructor({ port, jobRegistry, workersRegistry }) {
    this.#port = port;
    this.#app = express();
    this.#app.use(new Router({ jobRegistry, workersRegistry }).build());
  }

  start() {
    this.#app.listen(this.#port);
  }

  static build({ webConfig, jobRegistry, workersRegistry }) {
    if (!webConfig) return null;
    return new WebServer({ port: webConfig.port, jobRegistry, workersRegistry });
  }
}
```

### Step 6 — Update `Application` to use `WebServer.build()`

`Application` follows the same pattern as `buildEngine()`: a `buildWebServer()` method is called inside `run()`. The decision of whether to create a server lives entirely in `WebServer.build()`:

```js
run() {
  this.engine = this.buildEngine();
  this.webServer = this.buildWebServer();
  this.enqueueFirstJobs();
  this.webServer?.start();
  this.engine.start();
}

buildWebServer() {
  return WebServer.build({
    webConfig:       this.config.webConfig,
    jobRegistry:     this.jobRegistry,
    workersRegistry: this.workersRegistry,
  });
}
```

### Step 7 — Write specs

- `source/spec/models/WebConfig_spec.js` — constructor stores `port`.
- `source/spec/server/RequestHandler_spec.js` — `handle` is a no-op on the base class.
- `source/spec/server/StatsRequestHandler_spec.js` — `handle` calls `stats()` on both registries and responds with merged JSON.
- `source/spec/server/RouteRegister_spec.js` — `register` binds the route to `handler.handle` on the Express router.
- `source/spec/server/Router_spec.js` — `build()` returns an Express router with `/stats.json` wired to a `StatsRequestHandler`.
- `source/spec/server/WebServer_spec.js` — `start()` calls `app.listen` with the configured port; `build()` returns `null` when `webConfig` is absent, and a `WebServer` instance otherwise.
- `source/spec/services/ConfigParser_spec.js` — add cases: `web: port: 3000` produces a `WebConfig`; no `web:` produces `null`.
- `source/spec/services/Application_spec.js` — `run()` calls `webServer.start()` when present; no start when absent.

## Files to Change

- `source/lib/models/WebConfig.js` — **new**: web configuration model
- `source/lib/server/RequestHandler.js` — **new**: base handler class
- `source/lib/server/StatsRequestHandler.js` — **new**: stats handler extending RequestHandler
- `source/lib/server/RouteRegister.js` — **new**: binds route + handler to an Express router
- `source/lib/server/Router.js` — **new**: builds the Express router with all registered routes
- `source/lib/server/WebServer.js` — **new**: Express server with static `build()` factory
- `source/spec/models/WebConfig_spec.js` — **new**: specs for WebConfig
- `source/spec/server/RequestHandler_spec.js` — **new**: specs for base handler
- `source/spec/server/StatsRequestHandler_spec.js` — **new**: specs for stats handler
- `source/spec/server/RouteRegister_spec.js` — **new**: specs for route binding
- `source/spec/server/Router_spec.js` — **new**: specs for router build
- `source/spec/server/WebServer_spec.js` — **new**: specs for WebServer and `WebServer.build()`
- `source/lib/services/ConfigParser.js` — parse optional `web:` key
- `source/lib/models/Config.js` — store `webConfig`
- `source/lib/services/Application.js` — call `WebServer.build()` and start in `run()`
- `source/spec/services/ConfigParser_spec.js` — add web config parsing specs
- `source/spec/services/Application_spec.js` — add web server startup specs

## Notes

- `WebServer#start()` is a thin wrapper around `app.listen`; testing it via a spy avoids binding a real port in specs.
- The `web:` key is entirely optional — omitting it is the documented way to run Navi without the web server.
- This plan depends on issue #118 being merged first so that `stats()` exists on both registries.

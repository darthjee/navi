# Plan: Add Logs to Dev App

## Overview

Add Apache-style HTTP request logging to the dev Express application using the `morgan` middleware, so every incoming request is printed to stdout and visible in Docker Compose logs.

## Context

`dev/app/app.js` builds the Express app by mounting the route router and a catch-all 404 handler — no logging middleware exists today. The app has no `morgan` dependency yet. Tests in `spec/app_spec.js` use Supertest against the built app directly; adding morgan will cause log lines to print during test runs (noisy but harmless — tests only assert on status codes and response bodies).

## Implementation Steps

### Step 1 — Add `morgan` dependency

In `dev/app/`, run:

```bash
yarn add morgan
```

This updates `package.json` (dependencies) and `yarn.lock`.

### Step 2 — Mount the logging middleware in `app.js`

Import `morgan` and mount it as the first middleware in `buildApp`, before the router:

```js
import morgan from 'morgan';

const buildApp = (data) => {
  const app = express();
  app.use(morgan('combined'));
  app.use(new Router(data).build());
  app.use((_req, res) => notFound(res));
  return app;
};
```

The `combined` format produces Apache Combined Log lines, e.g.:
```
::1 - - [07/Apr/2026:12:34:56 +0000] "GET /categories.json HTTP/1.1" 200 512 "-" "node-superagent/..."
```

## Files to Change

- `dev/app/package.json` — adds `morgan` to `dependencies` (via `yarn add`)
- `dev/app/yarn.lock` — updated by `yarn add`
- `dev/app/app.js` — imports and mounts `morgan('combined')` as the first middleware

## CI Checks

Before opening a PR, run the following checks for `dev/app/`:

- `dev/app/`: `yarn test` (CircleCI job: `jasmine-dev`)
- `dev/app/`: `yarn lint` (CircleCI job: `checks-dev`)

## Notes

- `morgan` writes to `process.stdout` by default, so logs are captured by Docker Compose without any extra configuration.
- Test runs will print log lines to stdout. This is expected and does not break any assertions.
- No new test file is needed: morgan is a well-tested library and there is no custom logic to unit-test.

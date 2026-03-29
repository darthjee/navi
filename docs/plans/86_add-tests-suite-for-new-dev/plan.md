# Plan: Add Tests Suite for new-dev Node.js Container (#86)

Issue: https://github.com/darthjee/navi/issues/86
Parent: https://github.com/darthjee/navi/issues/68
Depends on: #79

## Context

With the Express server in place (`new-dev/app.js`, #79), this issue adds a dedicated test suite
for the `new-dev/` container using Jasmine + supertest, following the same framework already used
by the main application in `source/`.

All test files live under `new-dev/spec/`. The `test` script is added to `new-dev/package.json`.
CI is updated to run these tests alongside the main suite.

## Step 1 — Add test dependencies to `new-dev/package.json`

Add `jasmine` and `supertest` as dev dependencies and a `test` script:

```json
{
  "name": "navi-dev-server",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node app.js",
    "test": "jasmine"
  },
  "dependencies": {
    "express": "^4.18.0",
    "js-yaml": "^4.1.0"
  },
  "devDependencies": {
    "jasmine": "^5.0.0",
    "supertest": "^7.0.0"
  }
}
```

Regenerate `new-dev/yarn.lock` after adding the dev dependencies.

## Step 2 — Initialise Jasmine

Create `new-dev/spec/support/jasmine.json`:

```json
{
  "spec_dir": "spec",
  "spec_files": ["**/*_spec.js"],
  "stopSpecOnExpectationFailure": false,
  "random": false
}
```

## Step 3 — Extract app for testability

Refactor `new-dev/app.js` to export the Express `app` without calling `app.listen()`, and add a
separate `new-dev/server.js` entry point that imports `app` and calls `listen`:

**`new-dev/app.js`** — export app, no listen:
```javascript
import express from 'express';
import { readFileSync } from 'fs';
import { load } from 'js-yaml';

const app = express();
const { categories } = load(readFileSync('./data.yml', 'utf8'));

// ... routes unchanged ...

export default app;
```

**`new-dev/server.js`** — entry point:
```javascript
import app from './app.js';
app.listen(80);
```

Update `new-dev/package.json` start script:
```json
"start": "node server.js"
```

## Step 4 — Write spec file

Create `new-dev/spec/app_spec.js` covering all endpoints:

```javascript
import request from 'supertest';
import app from '../app.js';

describe('GET /categories.json', () => {
  it('returns all categories without items', async () => {
    const res = await request(app).get('/categories.json');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].items).toBeUndefined();
  });
});

describe('GET /categories/:id.json', () => {
  it('returns the category', async () => {
    const res = await request(app).get('/categories/1.json');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(1);
  });

  it('returns 404 for unknown id', async () => {
    const res = await request(app).get('/categories/999.json');
    expect(res.status).toBe(404);
  });
});

describe('GET /categories/:id/items.json', () => {
  it('returns items for the category', async () => {
    const res = await request(app).get('/categories/1/items.json');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('returns 404 for unknown category', async () => {
    const res = await request(app).get('/categories/999/items.json');
    expect(res.status).toBe(404);
  });
});

describe('GET /categories/:id/items/:item_id.json', () => {
  it('returns the item', async () => {
    const res = await request(app).get('/categories/1/items/1.json');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(1);
  });

  it('returns 404 for unknown item', async () => {
    const res = await request(app).get('/categories/1/items/999.json');
    expect(res.status).toBe(404);
  });
});

describe('unmatched routes', () => {
  it('returns 404', async () => {
    const res = await request(app).get('/unknown');
    expect(res.status).toBe(404);
  });
});
```

## Step 5 — Update CI

Add a step to the CI workflow to run the new-dev tests:

```yaml
- name: Run new-dev tests
  run: |
    cd new-dev
    yarn install
    yarn test
```

## Acceptance Criteria

- [ ] `new-dev/package.json` has `test` script and `jasmine`/`supertest` dev dependencies.
- [ ] `new-dev/spec/app_spec.js` covers all endpoints (happy path + 404s).
- [ ] `yarn test` inside `new-dev/` passes.
- [ ] CI runs `yarn test` for `new-dev/` and fails on errors.
- [ ] `app.js` exports the Express app; `server.js` calls `listen`.

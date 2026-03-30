# Plan: Add Tests Suite for new-dev Node.js Container (#86)

Issue: <https://github.com/darthjee/navi/issues/86>
Parent: <https://github.com/darthjee/navi/issues/68>
Depends on: #79

## Context

With the Express server in place (`new-dev/app.js`, #79), this issue adds the same test suite
that the main project has: Jasmine + c8 coverage, ESLint, and JSCPD. Two new CircleCI jobs
(`jasmine-dev`, `checks-dev`) mirror the existing `jasmine` and `checks` jobs.

## Step 1 — Refactor `app.js` and add `server.js`

Export the Express app from `new-dev/app.js` without calling `listen`, so it can be imported
in tests:

**`new-dev/app.js`** — add `export default app;`, remove `app.listen(80)`:
```javascript
import express from 'express';
import { readFileSync } from 'fs';
import { load } from 'js-yaml';

const app = express();
const { categories } = load(readFileSync('./data.yml', 'utf8'));

app.get('/categories.json', (_req, res) => {
  res.json(categories.map(({ id, name }) => ({ id, name })));
});

app.get('/categories/:id.json', (req, res) => {
  const category = categories.find((c) => c.id === Number(req.params.id));
  if (!category) return res.status(404).json({ error: 'Not found' });
  res.json({ id: category.id, name: category.name });
});

app.get('/categories/:id/items.json', (req, res) => {
  const category = categories.find((c) => c.id === Number(req.params.id));
  if (!category) return res.status(404).json({ error: 'Not found' });
  res.json(category.items);
});

app.get('/categories/:id/items/:item_id.json', (req, res) => {
  const category = categories.find((c) => c.id === Number(req.params.id));
  if (!category) return res.status(404).json({ error: 'Not found' });
  const item = category.items.find((i) => i.id === Number(req.params.item_id));
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

export default app;
```

**`new-dev/server.js`** — new entry point:
```javascript
import app from './app.js';
app.listen(80);
```

## Step 2 — Update `new-dev/package.json`

Add dev dependencies and scripts matching the main project:

```json
{
  "name": "navi-dev-server",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node server.js",
    "test": "npx c8 jasmine spec/**/*.js",
    "coverage": "npx c8 --reporter=lcov jasmine spec/**/*.js",
    "lint": "eslint .",
    "report": "jscpd app.js spec --reporters console,html --output ./report/jscpd"
  },
  "dependencies": {
    "express": "^4.18.0",
    "js-yaml": "^4.1.0"
  },
  "devDependencies": {
    "@eslint/js": "^8.0.0",
    "eslint": "^8.0.1",
    "eslint-config-standard": "^17.0.0",
    "eslint-plugin-import": "^2.26.0",
    "eslint-plugin-jasmine": "^4.1.3",
    "eslint-plugin-n": "^15.3.0",
    "eslint-plugin-promise": "^6.0.1",
    "globals": "^16.5.0",
    "jasmine": "^5.0.0",
    "jscpd": "4.0.8",
    "c8": "11.0.0",
    "supertest": "^7.0.0"
  },
  "jasmine": {
    "spec_dir": "spec",
    "spec_files": ["**/*[sS]pec.js"]
  },
  "c8": {
    "reporter": ["text", "html"],
    "extension": [".js"],
    "include": ["app.js"],
    "exclude": ["spec/**", "coverage/**", "report/**"],
    "all": true,
    "check-coverage": false
  }
}
```

Regenerate `new-dev/yarn.lock` after updating dependencies.

## Step 3 — Add ESLint config

Create `new-dev/eslint.config.js` mirroring the main project's style:

```javascript
import js from '@eslint/js';
import globals from 'globals';
import pluginImport from 'eslint-plugin-import';
import pluginN from 'eslint-plugin-n';
import pluginPromise from 'eslint-plugin-promise';
import pluginJasmine from 'eslint-plugin-jasmine';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.node }
    },
    plugins: {
      import: pluginImport,
      n: pluginN,
      promise: pluginPromise
    },
    rules: {
      semi: ['error', 'always'],
      quotes: ['error', 'single'],
      indent: ['error', 2]
    }
  },
  {
    files: ['spec/**/*.js'],
    plugins: { jasmine: pluginJasmine },
    env: { jasmine: true }
  }
];
```

## Step 4 — Write `new-dev/spec/app_spec.js`

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

## Step 5 — Update `.circleci/config.yml`

Add `jasmine-dev` and `checks-dev` to the workflow and define the jobs:

```yaml
workflows:
  test-and-release:
    jobs:
      - jasmine:
          filters:
            tags:
              only: /.*/
      - checks:
          filters:
            tags:
              only: /.*/
      - jasmine-dev:
          filters:
            tags:
              only: /.*/
      - checks-dev:
          filters:
            tags:
              only: /.*/

jobs:
  # ... existing jasmine and checks jobs ...

  jasmine-dev:
    docker:
      - image: darthjee/circleci_node:0.2.1
    steps:
      - checkout
      - run:
          name: Install dependencies
          command: cd new-dev; yarn install
      - run:
          name: Unit tests (Jasmine + c8 coverage)
          command: cd new-dev; npm run coverage
      - run:
          name: Upload coverage to Codacy
          command: cd new-dev; bash <(curl -Ls https://coverage.codacy.com/get.sh) report -r coverage/lcov.info

  checks-dev:
    docker:
      - image: darthjee/circleci_node:0.2.1
    steps:
      - checkout
      - run:
          name: Install dependencies
          command: cd new-dev; yarn install
      - run:
          name: Lint
          command: cd new-dev; npm run lint
      - run:
          name: Duplication report (JSCPD)
          command: cd new-dev; npm run report
```

## Acceptance Criteria

- [ ] `new-dev/app.js` exports the Express app; `new-dev/server.js` calls `listen`.
- [ ] `new-dev/package.json` has `test`, `coverage`, `lint`, `report` scripts.
- [ ] `new-dev/eslint.config.js` exists and `yarn lint` passes.
- [ ] `new-dev/spec/app_spec.js` covers all endpoints (happy path + 404s).
- [ ] `yarn test` inside `new-dev/` passes with c8 coverage output.
- [ ] `yarn coverage` produces `coverage/lcov.info`.
- [ ] `yarn report` runs JSCPD without errors.
- [ ] CircleCI `jasmine-dev` job runs tests and uploads coverage to Codacy.
- [ ] CircleCI `checks-dev` job runs lint and JSCPD report.

# Plan: Refactor new-dev Application (#93)

Issue: https://github.com/darthjee/navi/issues/93

## Context

`new-dev/app.js` is a single file that handles data loading, error responses, and all route
definitions. Three route handlers repeat the same `categories.find(...)` call and the same
404 response. The refactor extracts each concern into a dedicated module under `new-dev/lib/`.

## Step 1 — `new-dev/lib/data.js` (data loading)

Move `readFileSync` + `js-yaml` out of `app.js` and export only the parsed data.

```javascript
import { readFileSync } from 'fs';
import { load } from 'js-yaml';

export const { categories } = load(readFileSync('./data.yml', 'utf8'));
```

## Step 2 — `new-dev/lib/not_found.js` (error helper)

Single source of truth for the 404 response shape.

```javascript
export const notFound = (res) => res.status(404).json({ error: 'Not found' });
```

## Step 3 — `new-dev/lib/router.js` (routing)

Express Router using `findCategory` (local helper) and `notFound` to eliminate repetition.

```javascript
import { Router } from 'express';
import { categories } from './data.js';
import { notFound } from './not_found.js';

const router = Router();

const findCategory = (id) => categories.find((c) => c.id === Number(id));

router.get('/categories.json', (_req, res) => {
  res.json(categories.map(({ id, name }) => ({ id, name })));
});

router.get('/categories/:id.json', (req, res) => {
  const category = findCategory(req.params.id);
  if (!category) return notFound(res);
  res.json({ id: category.id, name: category.name });
});

router.get('/categories/:id/items.json', (req, res) => {
  const category = findCategory(req.params.id);
  if (!category) return notFound(res);
  res.json(category.items);
});

router.get('/categories/:id/items/:item_id.json', (req, res) => {
  const category = findCategory(req.params.id);
  if (!category) return notFound(res);
  const item = category.items.find((i) => i.id === Number(req.params.item_id));
  if (!item) return notFound(res);
  res.json(item);
});

export default router;
```

## Step 4 — `new-dev/app.js` (composition root)

Thin file: creates the Express app, mounts the router, registers the catch-all.

```javascript
import express from 'express';
import router from './lib/router.js';
import { notFound } from './lib/not_found.js';

const app = express();

app.use(router);
app.use((_req, res) => notFound(res));

export default app;
```

## Step 5 — `new-dev/package.json`

Update two fields to include `lib/`:

**`c8.include`** — add `lib/**/*.js` so coverage tracks the new modules:
```json
"include": ["app.js", "lib/**/*.js"]
```

**`scripts.report`** — add `lib` to the JSCPD analysis:
```json
"report": "jscpd app.js lib spec --reporters console,html --output ./report/jscpd"
```

## No spec changes needed

`spec/app_spec.js` imports `app` and exercises all routes end-to-end. The refactor
preserves every route and response, so all existing tests continue to pass unchanged.
The new `lib/` modules are fully exercised through those integration tests.

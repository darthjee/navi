# Plan: Create Express Dev Server (#79)

Issue: https://github.com/darthjee/navi/issues/79
Parent: https://github.com/darthjee/navi/issues/68
Depends on: #78

## Context

With `new-dev/data.yml` in place (#78), this issue creates the Node.js Express application that
reads it at startup and serves all four endpoint groups dynamically.

All files are created in `new-dev/`. The rename to `dev/` happens in issue #82.

## Step 1 — Create `new-dev/package.json`

Minimal package definition declaring `express` and `js-yaml` as dependencies:

```json
{
  "name": "navi-dev-server",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node app.js"
  },
  "dependencies": {
    "express": "^4.18.0",
    "js-yaml": "^4.1.0"
  }
}
```

Run `yarn install` inside `new-dev/` to generate `new-dev/yarn.lock`.

## Step 2 — Create `new-dev/app.js`

Express app that reads `data.yml` and registers all routes at startup:

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

app.listen(80);
```

## Acceptance Criteria

- [ ] `new-dev/package.json` and `new-dev/yarn.lock` exist.
- [ ] `new-dev/app.js` exists and starts without errors with `node app.js` from inside `new-dev/`.
- [ ] `GET /categories.json` returns all categories without `items`.
- [ ] `GET /categories/:id.json` returns the correct category or `404`.
- [ ] `GET /categories/:id/items.json` returns the correct items list or `404`.
- [ ] `GET /categories/:id/items/:item_id.json` returns the correct item or `404`.
- [ ] Unmatched routes return `404` JSON.

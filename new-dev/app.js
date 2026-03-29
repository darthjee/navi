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

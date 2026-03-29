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

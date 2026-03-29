import { Router as ExpressRouter } from 'express';
import DataNavigator from './data_navigator.js';
import { notFound } from './not_found.js';

class Router {
  constructor(data) {
    this._data = data;
  }

  build() {
    const router = ExpressRouter();

    router.get('/categories.json', (_req, res) => {
      const categories = new DataNavigator(this._data, ['categories']).navigate();
      res.json(categories.map(({ id, name }) => ({ id, name })));
    });

    router.get('/categories/:id.json', (req, res) => {
      const category = new DataNavigator(
        this._data, ['categories', Number(req.params.id)]
      ).navigate();
      if (!category) return notFound(res);
      res.json({ id: category.id, name: category.name });
    });

    router.get('/categories/:id/items.json', (req, res) => {
      const items = new DataNavigator(
        this._data, ['categories', Number(req.params.id), 'items']
      ).navigate();
      if (!items) return notFound(res);
      res.json(items);
    });

    router.get('/categories/:id/items/:item_id.json', (req, res) => {
      const item = new DataNavigator(
        this._data, ['categories', Number(req.params.id), 'items', Number(req.params.item_id)]
      ).navigate();
      if (!item) return notFound(res);
      res.json(item);
    });

    return router;
  }
}

export default Router;

import { Router as ExpressRouter } from 'express';
import DataNavigator from './DataNavigator.js';
import { notFound } from './not_found.js';
import RouteParamsExtractor from './RouteParamsExtractor.js';
import RouteRegistrar from './RouteRegistrar.js';

class Router {
  constructor(data) {
    this._data = data;
  }

  build() {
    const router = ExpressRouter();
    const registrar = new RouteRegistrar(router, this._data);

    router.get('/categories.json', (req, res) => {
      const steps = new RouteParamsExtractor('/categories.json', req.params).steps();
      const result = new DataNavigator(this._data, steps).navigate();
      res.json(result.map(({ id, name }) => ({ id, name })));
    });

    router.get('/categories/:id.json', (req, res) => {
      const steps = new RouteParamsExtractor('/categories/:id.json', req.params).steps();
      const result = new DataNavigator(this._data, steps).navigate();
      if (!result) return notFound(res);
      res.json({ id: result.id, name: result.name });
    });

    registrar.register('/categories/:id/items.json');
    registrar.register('/categories/:id/items/:item_id.json');

    return router;
  }
}

export default Router;

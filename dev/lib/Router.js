import { Router as ExpressRouter } from 'express';
import RouteRegister from './RouteRegister.js';

class Router {
  constructor(data) {
    this._data = data;
  }

  build() {
    const router = ExpressRouter();
    const register = new RouteRegister(router, this._data);

    register.register({ route: '/categories.json', attributes: ['id', 'name'] });
    register.register({ route: '/categories/:id.json', attributes: ['id', 'name'] });
    register.register({ route: '/categories/:id/items.json' });
    register.register({ route: '/categories/:id/items/:item_id.json' });

    return router;
  }
}

export default Router;

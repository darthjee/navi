import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { AssetsRequestHandler } from './AssetsRequestHandler.js';
import { BaseUrlsRequestHandler } from './BaseUrlsRequestHandler.js';
import { IndexRequestHandler } from './IndexRequestHandler.js';
import { JobRequestHandler } from './JobRequestHandler.js';
import { JobsRequestHandler } from './JobsRequestHandler.js';
import { RouteRegister } from './RouteRegister.js';
import { StatsRequestHandler } from './StatsRequestHandler.js';

const { Router: ExpressRouter } = express;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const staticDir = path.join(__dirname, '../../static');

/**
 * Builds the Express router with all application routes.
 * @author darthjee
 */
class Router {
  /**
   * Creates a new Router instance.
   */
  constructor() {}

  /**
   * Creates and returns an Express Router with all routes registered.
   * @returns {object} An Express Router instance.
   */
  build() {
    const router = ExpressRouter();
    const register = new RouteRegister(router);

    register.register({
      route:   '/stats.json',
      handler: new StatsRequestHandler(),
    });

    register.register({
      route:   '/clients/base_urls.json',
      handler: new BaseUrlsRequestHandler(),
    });

    register.register({
      route:   '/jobs/:status.json',
      handler: new JobsRequestHandler(),
    });

    register.register({
      route:   '/job/:id.json',
      handler: new JobRequestHandler(),
    });

    register.register({
      route:   '/',
      handler: new IndexRequestHandler(),
    });

    register.register({
      route:   '/assets/*path',
      handler: new AssetsRequestHandler(),
    });

    router.use(express.static(staticDir));

    router.use((_req, res) => {
      new IndexRequestHandler().handle(_req, res);
    });

    return router;
  }
}

export { Router };

import path from 'path';
import { fileURLToPath } from 'url';
import express, { Router as ExpressRouter } from 'express';
import ContentHandler from './ContentHandler.js';
import IndexRequestHandler from './IndexRequestHandler.js';
import { REDIRECT_ROUTES } from './redirect_routes.config.js';
import RedirectHandler from './RedirectHandler.js';
import RouteRegister from './RouteRegister.js';
import { ROUTES } from './routes.config.js';
import Serializer from './Serializer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const staticDir = path.join(__dirname, '../static');

/**
 * Builds and returns the configured Express router with all application routes
 * registered for the categories-and-items API.
 */
class Router {
  #data;

  /**
   * @param {Object} data - Parsed YAML data loaded at startup.
   */
  constructor(data) {
    this.#data = data;
  }

  /**
   * Registers all GET routes through a single unified registry and returns the
   * Express router. JSON routes are registered first so that `.json` paths are
   * matched by their exact patterns before the more general redirect patterns.
   * @returns {import('express').Router}
   */
  build() {
    const router = ExpressRouter();
    const register = new RouteRegister(router);

    ROUTES.forEach(({ route, attributes }) => {
      const serializer = attributes ? new Serializer(attributes) : null;
      register.register(route, new ContentHandler(route, this.#data, serializer));
    });

    REDIRECT_ROUTES.forEach(({ route, target }) => {
      register.register(route, new RedirectHandler(target));
    });

    router.use(express.static(staticDir));

    router.use((_req, res) => {
      new IndexRequestHandler().handle(_req, res);
    });

    return router;
  }
}

export default Router;

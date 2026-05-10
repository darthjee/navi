import path from 'path';
import { fileURLToPath } from 'url';
import express, { Router as ExpressRouter } from 'express';
import { HandlerConfig } from '../common/server/HandlerConfig.js';
import { REDIRECT_ROUTES } from './redirect_routes.config.js';
import RouteRegister from './RouteRegister.js';
import { ROUTES } from './routes.config.js';
import CollectionHandlerExecutor from '../handlers/CollectionHandlerExecutor.js';
import ContentHandlerExecutor from '../handlers/ContentHandlerExecutor.js';
import IndexHandlerExecutor from '../handlers/IndexHandlerExecutor.js';
import RedirectHandlerExecutor from '../handlers/RedirectHandlerExecutor.js';
import Serializer from '../models/Serializer.js';

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

    ROUTES.forEach(({ route, attributes, collection }) => {
      const serializer = attributes ? new Serializer(attributes) : null;
      const ExecutorClass = collection ? CollectionHandlerExecutor : ContentHandlerExecutor;
      register.register(route, new HandlerConfig(ExecutorClass, [route, this.#data, serializer]));
    });

    REDIRECT_ROUTES.forEach(({ route, target }) => {
      register.register(route, new HandlerConfig(RedirectHandlerExecutor, [target]));
    });

    router.use(express.static(staticDir));

    router.use((_req, res) => {
      new HandlerConfig(IndexHandlerExecutor).handle(_req, res);
    });

    return router;
  }
}

export default Router;

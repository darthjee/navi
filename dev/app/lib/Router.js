import { Router as ExpressRouter } from 'express';
import { REDIRECT_ROUTES } from './redirect_routes.config.js';
import RedirectRegister from './RedirectRegister.js';
import RouteRegister from './RouteRegister.js';
import { ROUTES } from './routes.config.js';

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
   * Registers all GET routes and returns the Express router.
   * JSON routes are registered first so that `.json` paths are matched by
   * their exact patterns before the more general redirect patterns are tried.
   * @returns {import('express').Router}
   */
  build() {
    const router = ExpressRouter();
    const redirectRegister = new RedirectRegister(router);
    const register = new RouteRegister(router, this.#data);

    ROUTES.forEach(route => register.register(route));
    REDIRECT_ROUTES.forEach(route => redirectRegister.register(route));

    return router;
  }
}

export default Router;

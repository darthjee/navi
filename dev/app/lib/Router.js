import { Router as ExpressRouter } from 'express';
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
   * @returns {import('express').Router}
   */
  build() {
    const router = ExpressRouter();
    const register = new RouteRegister(router, this.#data);

    ROUTES.forEach(route => register.register(route));

    return router;
  }
}

export default Router;

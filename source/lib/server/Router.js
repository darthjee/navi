import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { RouteRegister } from './RouteRegister.js';
import { StatsRequestHandler } from './StatsRequestHandler.js';

const { Router: ExpressRouter } = express;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '../../public');

/**
 * Builds the Express router with all application routes.
 * @author darthjee
 */
class Router {
  #jobRegistry;
  #workersRegistry;

  /**
   * @param {object} params - Options for initializing the Router.
   * @param {object} params.jobRegistry - The job registry instance.
   * @param {object} params.workersRegistry - The workers registry instance.
   */
  constructor({ jobRegistry, workersRegistry }) {
    this.#jobRegistry = jobRegistry;
    this.#workersRegistry = workersRegistry;
  }

  /**
   * Creates and returns an Express Router with all routes registered.
   * @returns {object} An Express Router instance.
   */
  build() {
    const router = ExpressRouter();
    const register = new RouteRegister(router);

    register.register({
      route:   '/stats.json',
      handler: new StatsRequestHandler({
        jobRegistry:     this.#jobRegistry,
        workersRegistry: this.#workersRegistry,
      }),
    });

    router.use(express.static(publicDir));

    router.get('*', (_req, res) => {
      res.sendFile(path.join(publicDir, 'index.html'));
    });

    return router;
  }
}

export { Router };

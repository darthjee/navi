import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { AssetsRequestHandler } from './AssetsRequestHandler.js';
import { BaseUrlsRequestHandler } from './BaseUrlsRequestHandler.js';
import { EngineContinueRequestHandler } from './EngineContinueRequestHandler.js';
import { EnginePauseRequestHandler } from './EnginePauseRequestHandler.js';
import { EngineRestartRequestHandler } from './EngineRestartRequestHandler.js';
import { EngineShutdownRequestHandler } from './EngineShutdownRequestHandler.js';
import { EngineStartRequestHandler } from './EngineStartRequestHandler.js';
import { EngineStatusRequestHandler } from './EngineStatusRequestHandler.js';
import { EngineStopRequestHandler } from './EngineStopRequestHandler.js';
import { IndexRequestHandler } from './IndexRequestHandler.js';
import { JobRequestHandler } from './JobRequestHandler.js';
import { JobsRequestHandler } from './JobsRequestHandler.js';
import { LogsRequestHandler } from './LogsRequestHandler.js';
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
  #webConfig;

  /**
   * Creates a new Router instance.
   * @param {object} [options={}]
   * @param {object} [options.webConfig={}] - Web configuration, used by handlers that need it.
   */
  constructor({ webConfig = {} } = {}) {
    this.#webConfig = webConfig;
  }

  /**
   * Creates and returns an Express Router with all routes registered.
   * @returns {object} An Express Router instance.
   */
  build() {
    const router = ExpressRouter();
    const register = new RouteRegister(router);

    const GET_ROUTES = {
      '/stats.json':              new StatsRequestHandler(),
      '/clients/base_urls.json':  new BaseUrlsRequestHandler(),
      '/jobs/:status.json':       new JobsRequestHandler(),
      '/job/:id.json':            new JobRequestHandler(),
      '/engine/status':           new EngineStatusRequestHandler(),
      '/logs.json':               new LogsRequestHandler({ pageSize: this.#webConfig.logsPageSize }),
      '/':                        new IndexRequestHandler(),
      '/assets/*path':            new AssetsRequestHandler(),
    };

    const PATCH_ROUTES = {
      '/engine/pause':     new EnginePauseRequestHandler(),
      '/engine/stop':      new EngineStopRequestHandler(),
      '/engine/continue':  new EngineContinueRequestHandler(),
      '/engine/start':     new EngineStartRequestHandler(),
      '/engine/restart':   new EngineRestartRequestHandler(),
      '/engine/shutdown':  new EngineShutdownRequestHandler(),
    };

    Object.entries(GET_ROUTES).forEach(([route, handler]) => {
      register.register({ route, handler });
    });

    Object.entries(PATCH_ROUTES).forEach(([route, handler]) => {
      register.registerPatch({ route, handler });
    });

    router.use(express.static(staticDir));

    router.use((_req, res) => {
      new IndexRequestHandler().handle(_req, res);
    });

    return router;
  }
}

export { Router };

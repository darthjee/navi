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
      '/stats.json':              StatsRequestHandler,
      '/clients/base_urls.json':  BaseUrlsRequestHandler,
      '/jobs/:status.json':       JobsRequestHandler,
      '/job/:id.json':            JobRequestHandler,
      '/engine/status':           EngineStatusRequestHandler,
      '/':                        IndexRequestHandler,
      '/assets/*path':            AssetsRequestHandler,
    };

    const PATCH_ROUTES = {
      '/engine/pause':     EnginePauseRequestHandler,
      '/engine/stop':      EngineStopRequestHandler,
      '/engine/continue':  EngineContinueRequestHandler,
      '/engine/start':     EngineStartRequestHandler,
      '/engine/restart':   EngineRestartRequestHandler,
      '/engine/shutdown':  EngineShutdownRequestHandler,
    };

    Object.entries(GET_ROUTES).forEach(([route, HandlerClass]) => {
      register.register({ route, handler: new HandlerClass() });
    });

    register.register({
      route: '/logs.json',
      handler: new LogsRequestHandler({ pageSize: this.#webConfig.logsPageSize }),
    });

    Object.entries(PATCH_ROUTES).forEach(([route, HandlerClass]) => {
      register.registerPatch({ route, handler: new HandlerClass() });
    });

    router.use(express.static(staticDir));

    router.use((_req, res) => {
      new IndexRequestHandler().handle(_req, res);
    });

    return router;
  }
}

export { Router };

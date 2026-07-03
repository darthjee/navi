import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { AssetsHandler } from './handlers/AssetsHandler.js';
import { HandlerConfig } from '../common/server/HandlerConfig.js';
import { EngineContinueHandler } from './handlers/engine/EngineContinueHandler.js';
import { EnginePauseHandler } from './handlers/engine/EnginePauseHandler.js';
import { EngineRestartHandler } from './handlers/engine/EngineRestartHandler.js';
import { EngineShutdownHandler } from './handlers/engine/EngineShutdownHandler.js';
import { EngineStartHandler } from './handlers/engine/EngineStartHandler.js';
import { EngineStatusHandler } from './handlers/engine/EngineStatusHandler.js';
import { EngineStopHandler } from './handlers/engine/EngineStopHandler.js';
import { IndexHandler } from './handlers/IndexHandler.js';
import { JobHandler } from './handlers/jobs/JobHandler.js';
import { JobLogsHandler } from './handlers/jobs/JobLogsHandler.js';
import { JobRetryHandler } from './handlers/jobs/JobRetryHandler.js';
import { JobsHandler } from './handlers/jobs/JobsHandler.js';
import { LinksHandler } from './handlers/LinksHandler.js';
import { LogsHandler } from './handlers/LogsHandler.js';
import { SettingsHandler } from './handlers/SettingsHandler.js';
import { StatsHandler } from './handlers/StatsHandler.js';
import { PathValidator } from './PathValidator.js';
import { RouteRegister } from './RouteRegister.js';

const { Router: ExpressRouter } = express;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const staticDir = path.join(__dirname, '../../static');
const assetsDir = path.join(staticDir, 'assets');
const assetsValidator = new PathValidator(assetsDir);

/**
 * Builds the Express router with all application routes.
 * @author darthjee
 */
class Router {
  #webConfig;

  /**
   * Creates a new Router instance.
   * @param {object} [options={}] - Constructor options.
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

    router.use(express.json());

    const GET_ROUTES = {
      '/settings.json':           new HandlerConfig(SettingsHandler, this.#webConfig.enableShutdown),
      '/stats.json':              new HandlerConfig(StatsHandler),
      '/jobs/:status.json':       new HandlerConfig(JobsHandler),
      '/jobs/:job_id/logs.json':  new HandlerConfig(JobLogsHandler, this.#webConfig.logsPageSize),
      '/job/:id.json':            new HandlerConfig(JobHandler),
      '/engine/status':           new HandlerConfig(EngineStatusHandler),
      '/logs.json':               new HandlerConfig(LogsHandler, this.#webConfig.logsPageSize),
      '/links.json':              new HandlerConfig(LinksHandler, [this.#webConfig.links]),
      '/':                        new HandlerConfig(IndexHandler),
      '/assets/*path':            new HandlerConfig(AssetsHandler, [assetsDir, assetsValidator]),
    };

    const PATCH_ROUTES = {
      '/jobs/:id/retry':   new HandlerConfig(JobRetryHandler),
      '/engine/pause':     new HandlerConfig(EnginePauseHandler),
      '/engine/stop':      new HandlerConfig(EngineStopHandler),
      '/engine/continue':  new HandlerConfig(EngineContinueHandler),
      '/engine/start':     new HandlerConfig(EngineStartHandler),
      '/engine/restart':   new HandlerConfig(EngineRestartHandler),
      '/engine/shutdown':  new HandlerConfig(EngineShutdownHandler),
    };

    Object.entries(GET_ROUTES).forEach(([route, handler]) => {
      register.register({ route, handler });
    });

    Object.entries(PATCH_ROUTES).forEach(([route, handler]) => {
      register.registerPatch({ route, handler });
    });

    router.use(express.static(staticDir));

    router.use((_req, res) => {
      new HandlerConfig(IndexHandler).handle(_req, res);
    });

    return router;
  }
}

export { Router };

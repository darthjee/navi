import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { HandlerConfig } from './HandlerConfig.js';
import { AssetsRequestHandler } from './handlers/AssetsRequestHandler.js';
import { EngineContinueRequestHandler } from './handlers/engine/EngineContinueRequestHandler.js';
import { EnginePauseRequestHandler } from './handlers/engine/EnginePauseRequestHandler.js';
import { EngineRestartRequestHandler } from './handlers/engine/EngineRestartRequestHandler.js';
import { EngineShutdownRequestHandler } from './handlers/engine/EngineShutdownRequestHandler.js';
import { EngineStartRequestHandler } from './handlers/engine/EngineStartRequestHandler.js';
import { EngineStatusRequestHandler } from './handlers/engine/EngineStatusRequestHandler.js';
import { EngineStopRequestHandler } from './handlers/engine/EngineStopRequestHandler.js';
import { IndexRequestHandler } from './handlers/IndexRequestHandler.js';
import { JobLogsRequestHandler } from './handlers/jobs/JobLogsRequestHandler.js';
import { JobRequestHandler } from './handlers/jobs/JobRequestHandler.js';
import { JobRetryRequestHandler } from './handlers/jobs/JobRetryRequestHandler.js';
import { JobsRequestHandler } from './handlers/jobs/JobsRequestHandler.js';
import { LinksRequestHandler } from './handlers/LinksRequestHandler.js';
import { LogsRequestHandler } from './handlers/LogsRequestHandler.js';
import { SettingsRequestHandler } from './handlers/SettingsRequestHandler.js';
import { StatsRequestHandler } from './handlers/StatsRequestHandler.js';
import { RouteRegister } from './RouteRegister.js';

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

    const GET_ROUTES = {
      '/settings.json':           new HandlerConfig(SettingsRequestHandler, { enableShutdown: this.#webConfig.enableShutdown }),
      '/stats.json':              new HandlerConfig(StatsRequestHandler),
      '/jobs/:status.json':       new HandlerConfig(JobsRequestHandler),
      '/jobs/:job_id/logs.json':  new HandlerConfig(JobLogsRequestHandler, { pageSize: this.#webConfig.logsPageSize }),
      '/job/:id.json':            new HandlerConfig(JobRequestHandler),
      '/engine/status':           new HandlerConfig(EngineStatusRequestHandler),
      '/logs.json':               new HandlerConfig(LogsRequestHandler, { pageSize: this.#webConfig.logsPageSize }),
      '/links.json':              new HandlerConfig(LinksRequestHandler, { links: this.#webConfig.links }),
      '/':                        new HandlerConfig(IndexRequestHandler),
      '/assets/*path':            new HandlerConfig(AssetsRequestHandler),
    };

    const PATCH_ROUTES = {
      '/jobs/:id/retry':   new HandlerConfig(JobRetryRequestHandler),
      '/engine/pause':     new HandlerConfig(EnginePauseRequestHandler),
      '/engine/stop':      new HandlerConfig(EngineStopRequestHandler),
      '/engine/continue':  new HandlerConfig(EngineContinueRequestHandler),
      '/engine/start':     new HandlerConfig(EngineStartRequestHandler),
      '/engine/restart':   new HandlerConfig(EngineRestartRequestHandler),
      '/engine/shutdown':  new HandlerConfig(EngineShutdownRequestHandler),
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

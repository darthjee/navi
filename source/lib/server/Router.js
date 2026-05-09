import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { AssetsRequestHandler } from './handlers/AssetsRequestHandler.js';
import { BaseUrlsRequestHandler } from './handlers/BaseUrlsRequestHandler.js';
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
      '/settings.json':           new SettingsRequestHandler({ enableShutdown: this.#webConfig.enableShutdown }),
      '/stats.json':              new StatsRequestHandler(),
      '/clients/base_urls.json':  new BaseUrlsRequestHandler(),
      '/jobs/:status.json':       new JobsRequestHandler(),
      '/jobs/:job_id/logs.json':  new JobLogsRequestHandler({ pageSize: this.#webConfig.logsPageSize }),
      '/job/:id.json':            new JobRequestHandler(),
      '/engine/status':           new EngineStatusRequestHandler(),
      '/logs.json':               new LogsRequestHandler({ pageSize: this.#webConfig.logsPageSize }),
      '/links.json':              new LinksRequestHandler({ links: this.#webConfig.links }),
      '/':                        new IndexRequestHandler(),
      '/assets/*path':            new AssetsRequestHandler(),
    };

    const PATCH_ROUTES = {
      '/jobs/:id/retry':   new JobRetryRequestHandler(),
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

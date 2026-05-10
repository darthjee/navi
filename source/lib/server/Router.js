import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { HandlerConfig } from './HandlerConfig.js';
import { PathValidator } from './PathValidator.js';
import { AssetsHandlerExecutor } from './handlers/AssetsHandlerExecutor.js';
import { EngineContinueHandlerExecutor } from './handlers/engine/EngineContinueHandlerExecutor.js';
import { EnginePauseHandlerExecutor } from './handlers/engine/EnginePauseHandlerExecutor.js';
import { EngineRestartHandlerExecutor } from './handlers/engine/EngineRestartHandlerExecutor.js';
import { EngineShutdownHandlerExecutor } from './handlers/engine/EngineShutdownHandlerExecutor.js';
import { EngineStartHandlerExecutor } from './handlers/engine/EngineStartHandlerExecutor.js';
import { EngineStatusHandlerExecutor } from './handlers/engine/EngineStatusHandlerExecutor.js';
import { EngineStopHandlerExecutor } from './handlers/engine/EngineStopHandlerExecutor.js';
import { IndexHandlerExecutor } from './handlers/IndexHandlerExecutor.js';
import { JobLogsHandlerExecutor } from './handlers/jobs/JobLogsHandlerExecutor.js';
import { JobHandlerExecutor } from './handlers/jobs/JobHandlerExecutor.js';
import { JobRetryHandlerExecutor } from './handlers/jobs/JobRetryHandlerExecutor.js';
import { JobsHandlerExecutor } from './handlers/jobs/JobsHandlerExecutor.js';
import { LinksHandlerExecutor } from './handlers/LinksHandlerExecutor.js';
import { LogsHandlerExecutor } from './handlers/LogsHandlerExecutor.js';
import { SettingsHandlerExecutor } from './handlers/SettingsHandlerExecutor.js';
import { StatsHandlerExecutor } from './handlers/StatsHandlerExecutor.js';
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

    const GET_ROUTES = {
      '/settings.json':           new HandlerConfig(SettingsHandlerExecutor, this.#webConfig.enableShutdown),
      '/stats.json':              new HandlerConfig(StatsHandlerExecutor),
      '/jobs/:status.json':       new HandlerConfig(JobsHandlerExecutor),
      '/jobs/:job_id/logs.json':  new HandlerConfig(JobLogsHandlerExecutor, this.#webConfig.logsPageSize),
      '/job/:id.json':            new HandlerConfig(JobHandlerExecutor),
      '/engine/status':           new HandlerConfig(EngineStatusHandlerExecutor),
      '/logs.json':               new HandlerConfig(LogsHandlerExecutor, this.#webConfig.logsPageSize),
      '/links.json':              new HandlerConfig(LinksHandlerExecutor, this.#webConfig.links),
      '/':                        new HandlerConfig(IndexHandlerExecutor),
      '/assets/*path':            new HandlerConfig(AssetsHandlerExecutor, [assetsDir, assetsValidator]),
    };

    const PATCH_ROUTES = {
      '/jobs/:id/retry':   new HandlerConfig(JobRetryHandlerExecutor),
      '/engine/pause':     new HandlerConfig(EnginePauseHandlerExecutor),
      '/engine/stop':      new HandlerConfig(EngineStopHandlerExecutor),
      '/engine/continue':  new HandlerConfig(EngineContinueHandlerExecutor),
      '/engine/start':     new HandlerConfig(EngineStartHandlerExecutor),
      '/engine/restart':   new HandlerConfig(EngineRestartHandlerExecutor),
      '/engine/shutdown':  new HandlerConfig(EngineShutdownHandlerExecutor),
    };

    Object.entries(GET_ROUTES).forEach(([route, handler]) => {
      register.register({ route, handler });
    });

    Object.entries(PATCH_ROUTES).forEach(([route, handler]) => {
      register.registerPatch({ route, handler });
    });

    router.use(express.static(staticDir));

    router.use((_req, res) => {
      new HandlerConfig(IndexHandlerExecutor).handle(_req, res);
    });

    return router;
  }
}

export { Router };

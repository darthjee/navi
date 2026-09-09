import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { AssetsHandler } from './handlers/AssetsHandler.js';
import { HandlerConfig } from '../common/server/HandlerConfig.js';
import { ApiConfigHandler } from './handlers/api/ApiConfigHandler.js';
import { ApiEngineStartHandler } from './handlers/api/ApiEngineStartHandler.js';
import { ApiEngineStopHandler } from './handlers/api/ApiEngineStopHandler.js';
import { EmissionsHandler } from './handlers/emissions/EmissionsHandler.js';
import { EngineContinueHandler } from './handlers/engine/EngineContinueHandler.js';
import { EnginePauseHandler } from './handlers/engine/EnginePauseHandler.js';
import { EngineReloadHandler } from './handlers/engine/EngineReloadHandler.js';
import { EngineRestartHandler } from './handlers/engine/EngineRestartHandler.js';
import { EngineShutdownHandler } from './handlers/engine/EngineShutdownHandler.js';
import { EngineStartHandler } from './handlers/engine/EngineStartHandler.js';
import { EngineStatusHandler } from './handlers/engine/EngineStatusHandler.js';
import { EngineStopHandler } from './handlers/engine/EngineStopHandler.js';
import { ExtractionsHandler } from './handlers/extractions/ExtractionsHandler.js';
import { FrontendAssetsHandler } from './handlers/FrontendAssetsHandler.js';
import { FrontendManifestHandler } from './handlers/FrontendManifestHandler.js';
import { IndexHandler } from './handlers/IndexHandler.js';
import { JobHandler } from './handlers/jobs/JobHandler.js';
import { JobLogsHandler } from './handlers/jobs/JobLogsHandler.js';
import { JobRetryHandler } from './handlers/jobs/JobRetryHandler.js';
import { JobsHandler } from './handlers/jobs/JobsHandler.js';
import { LinksHandler } from './handlers/LinksHandler.js';
import { LogsHandler } from './handlers/LogsHandler.js';
import { MemoryHistoryHandler } from './handlers/memory/MemoryHistoryHandler.js';
import { MemoryStatusHandler } from './handlers/memory/MemoryStatusHandler.js';
import { MenuHandler } from './handlers/MenuHandler.js';
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
 * Frozen set of every built-in `"<METHOD> <path>"` route key. Config-independent,
 * so it lives at module scope even though the per-request handler maps in
 * `build()` cannot. `ApplicationInstance` passes this into
 * `ExtensionRoutesLoader.load({ stockRouteKeys })` so extension routes that clash
 * with a stock route are dropped. Kept in sync with `build()` by a drift-guard
 * spec.
 * @type {Set<string>}
 */
const STOCK_ROUTE_KEYS = Object.freeze(new Set([
  'GET /settings.json',
  'GET /stats.json',
  'GET /jobs/:status.json',
  'GET /jobs/:job_id/logs.json',
  'GET /job/:id.json',
  'GET /engine/status',
  'GET /memory/status.json',
  'GET /memory/history.json',
  'GET /logs.json',
  'GET /emissions.json',
  'GET /extractions.json',
  'GET /links.json',
  'GET /menu.json',
  'GET /',
  'GET /assets/*path',
  'GET /extensions/frontend.json',
  'GET /extensions/frontend/*path',
  'PATCH /jobs/:id/retry',
  'PATCH /engine/pause',
  'PATCH /engine/stop',
  'PATCH /engine/continue',
  'PATCH /engine/start',
  'PATCH /engine/restart',
  'PATCH /engine/reload',
  'PATCH /engine/shutdown',
  'POST /api/config',
  'POST /api/engine/start',
  'POST /api/engine/stop',
]));

/**
 * Builds the Express router with all application routes.
 * @author darthjee
 */
class Router {
  #webConfig;
  #menuConfig;
  #extensionRoutes;

  /**
   * Creates a new Router instance.
   * @param {object} [options={}] - Constructor options.
   * @param {object} [options.webConfig={}] - Web configuration, used by handlers that need it.
   * @param {Array<import('../models/configs/MenuEntry.js').MenuEntry>} [options.menuConfig=[]] - Internal navigation menu entries.
   * @param {Array<{ method: string, path: string, handler: Function }>} [options.extensionRoutes=[]] - Validated, collision-filtered backend extension route descriptors.
   */
  constructor({ webConfig = {}, menuConfig = [], extensionRoutes = [] } = {}) {
    this.#webConfig = webConfig;
    this.#menuConfig = menuConfig;
    this.#extensionRoutes = extensionRoutes;
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
      '/memory/status.json':      new HandlerConfig(MemoryStatusHandler, [this.#webConfig.memory]),
      '/memory/history.json':     new HandlerConfig(MemoryHistoryHandler, this.#webConfig.memory?.dataStorePageSize),
      '/logs.json':               new HandlerConfig(LogsHandler, this.#webConfig.logsPageSize),
      '/emissions.json':          new HandlerConfig(EmissionsHandler, this.#webConfig.logsPageSize),
      '/extractions.json':        new HandlerConfig(ExtractionsHandler, this.#webConfig.logsPageSize),
      '/links.json':              new HandlerConfig(LinksHandler, [this.#webConfig.links]),
      '/menu.json':               new HandlerConfig(MenuHandler, [this.#menuConfig]),
      '/':                        new HandlerConfig(IndexHandler),
      '/assets/*path':            new HandlerConfig(AssetsHandler, [assetsDir, assetsValidator]),
      '/extensions/frontend.json': new HandlerConfig(FrontendManifestHandler),
      '/extensions/frontend/*path': new HandlerConfig(FrontendAssetsHandler),
    };

    const PATCH_ROUTES = {
      '/jobs/:id/retry':   new HandlerConfig(JobRetryHandler),
      '/engine/pause':     new HandlerConfig(EnginePauseHandler),
      '/engine/stop':      new HandlerConfig(EngineStopHandler),
      '/engine/continue':  new HandlerConfig(EngineContinueHandler),
      '/engine/start':     new HandlerConfig(EngineStartHandler),
      '/engine/restart':   new HandlerConfig(EngineRestartHandler),
      '/engine/reload':    new HandlerConfig(EngineReloadHandler),
      '/engine/shutdown':  new HandlerConfig(EngineShutdownHandler),
    };

    const POST_ROUTES = {
      '/api/config':        new HandlerConfig(ApiConfigHandler, this.#webConfig.apiToken),
      '/api/engine/start':  new HandlerConfig(ApiEngineStartHandler, this.#webConfig.apiToken),
      '/api/engine/stop':   new HandlerConfig(ApiEngineStopHandler, this.#webConfig.apiToken),
    };

    Object.entries(GET_ROUTES).forEach(([route, handler]) => {
      register.register({ route, handler });
    });

    Object.entries(PATCH_ROUTES).forEach(([route, handler]) => {
      register.registerPatch({ route, handler });
    });

    Object.entries(POST_ROUTES).forEach(([route, handler]) => {
      register.registerPost({ route, handler });
    });

    this.#registerExtensionRoutes(register);

    router.use(express.static(staticDir));

    router.use((_req, res) => {
      new HandlerConfig(IndexHandler).handle(_req, res);
    });

    return router;
  }

  /**
   * Registers the validated, collision-filtered backend extension descriptors on
   * the router. Input is trusted — the loader has already checked method, path
   * and collisions.
   * @param {RouteRegister} register - The route register bound to the Express router.
   * @returns {void}
   */
  #registerExtensionRoutes(register) {
    this.#extensionRoutes.forEach(({ method, path: route, handler }) => {
      const config = new HandlerConfig(handler);

      if (method === 'GET') register.register({ route, handler: config });
      else if (method === 'PATCH') register.registerPatch({ route, handler: config });
      else register.registerPost({ route, handler: config });
    });
  }
}

export { Router, STOCK_ROUTE_KEYS };

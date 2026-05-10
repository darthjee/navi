import { RequestHandler } from '../../../common/server/RequestHandler.js';
import { EngineShutdownHandlerExecutor } from './EngineShutdownHandlerExecutor.js';

/**
 * Handles PATCH /engine/shutdown requests.
 * Shuts down the web server and stops the engine.
 * @author darthjee
 */
class EngineShutdownRequestHandler extends RequestHandler {
  /**
   * Creates a new EngineShutdownRequestHandler instance.
   */
  constructor() {
    super();
  }

  /**
   * Delegates to EngineShutdownHandlerExecutor.
   * @param {object} req - The Express request object.
   * @param {object} res - The Express response object.
   * @returns {void}
   */
  handle(req, res) {
    new EngineShutdownHandlerExecutor(req, res).handle();
  }
}

export { EngineShutdownRequestHandler };

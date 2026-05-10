import { RequestHandler } from '../../../common/server/RequestHandler.js';
import { EngineStatusHandlerExecutor } from './EngineStatusHandlerExecutor.js';

/**
 * Handles GET /engine/status requests.
 * @author darthjee
 */
class EngineStatusRequestHandler extends RequestHandler {
  /**
   * Creates a new EngineStatusRequestHandler instance.
   */
  constructor() {
    super();
  }

  /**
   * Delegates to EngineStatusHandlerExecutor.
   * @param {object} req - The Express request object.
   * @param {object} res - The Express response object.
   * @returns {void}
   */
  handle(req, res) {
    new EngineStatusHandlerExecutor(req, res).handle();
  }
}

export { EngineStatusRequestHandler };

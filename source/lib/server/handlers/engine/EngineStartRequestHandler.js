import { RequestHandler } from '../../../common/server/RequestHandler.js';
import { EngineStartHandlerExecutor } from './EngineStartHandlerExecutor.js';

/**
 * Handles PATCH /engine/start requests.
 * Returns 409 Conflict if the engine is not in 'stopped' status.
 * @author darthjee
 */
class EngineStartRequestHandler extends RequestHandler {
  /**
   * Creates a new EngineStartRequestHandler instance.
   */
  constructor() {
    super();
  }

  /**
   * Delegates to EngineStartHandlerExecutor.
   * @param {object} req - The Express request object.
   * @param {object} res - The Express response object.
   * @returns {Promise<void>}
   */
  async handle(req, res) {
    await new EngineStartHandlerExecutor(req, res).handle();
  }
}

export { EngineStartRequestHandler };

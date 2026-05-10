import { RequestHandler } from '../../../common/server/RequestHandler.js';
import { EngineRestartHandlerExecutor } from './EngineRestartHandlerExecutor.js';

/**
 * Handles PATCH /engine/restart requests.
 * Returns 409 Conflict if the engine is not in 'running' status.
 * @author darthjee
 */
class EngineRestartRequestHandler extends RequestHandler {
  /**
   * Creates a new EngineRestartRequestHandler instance.
   */
  constructor() {
    super();
  }

  /**
   * Delegates to EngineRestartHandlerExecutor.
   * @param {object} req - The Express request object.
   * @param {object} res - The Express response object.
   * @returns {Promise<void>}
   */
  async handle(req, res) {
    await new EngineRestartHandlerExecutor(req, res).handle();
  }
}

export { EngineRestartRequestHandler };

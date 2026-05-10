import { RequestHandler } from '../../../common/server/RequestHandler.js';
import { EngineStopHandlerExecutor } from './EngineStopHandlerExecutor.js';

/**
 * Handles PATCH /engine/stop requests.
 * Returns 409 Conflict if the engine is not in 'running' status.
 * @author darthjee
 */
class EngineStopRequestHandler extends RequestHandler {
  /**
   * Creates a new EngineStopRequestHandler instance.
   */
  constructor() {
    super();
  }

  /**
   * Delegates to EngineStopHandlerExecutor.
   * @param {object} req - The Express request object.
   * @param {object} res - The Express response object.
   * @returns {Promise<void>}
   */
  async handle(req, res) {
    await new EngineStopHandlerExecutor(req, res).handle();
  }
}

export { EngineStopRequestHandler };

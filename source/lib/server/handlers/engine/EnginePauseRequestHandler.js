import { RequestHandler } from '../../../common/server/RequestHandler.js';
import { EnginePauseHandlerExecutor } from './EnginePauseHandlerExecutor.js';

/**
 * Handles PATCH /engine/pause requests.
 * Returns 409 Conflict if the engine is not in 'running' status.
 * @author darthjee
 */
class EnginePauseRequestHandler extends RequestHandler {
  /**
   * Creates a new EnginePauseRequestHandler instance.
   */
  constructor() {
    super();
  }

  /**
   * Delegates to EnginePauseHandlerExecutor.
   * @param {object} req - The Express request object.
   * @param {object} res - The Express response object.
   * @returns {Promise<void>}
   */
  async handle(req, res) {
    await new EnginePauseHandlerExecutor(req, res).handle();
  }
}

export { EnginePauseRequestHandler };

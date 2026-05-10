import { RequestHandler } from '../../../common/server/RequestHandler.js';
import { EngineContinueHandlerExecutor } from './EngineContinueHandlerExecutor.js';

/**
 * Handles PATCH /engine/continue requests.
 * Returns 409 Conflict if the engine is not in 'paused' status.
 * @author darthjee
 */
class EngineContinueRequestHandler extends RequestHandler {
  /**
   * Creates a new EngineContinueRequestHandler instance.
   */
  constructor() {
    super();
  }

  /**
   * Delegates to EngineContinueHandlerExecutor.
   * @param {object} req - The Express request object.
   * @param {object} res - The Express response object.
   * @returns {Promise<void>}
   */
  async handle(req, res) {
    await new EngineContinueHandlerExecutor(req, res).handle();
  }
}

export { EngineContinueRequestHandler };

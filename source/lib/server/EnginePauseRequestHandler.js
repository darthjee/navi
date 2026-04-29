import { RequestHandler } from './RequestHandler.js';
import { ConflictError } from '../exceptions/ConflictError.js';
import { Application } from '../services/Application.js';

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
   * Initiates engine pause. Responds immediately with the transitional status.
   * @param {object} _req - The Express request object.
   * @param {object} res - The Express response object.
   * @returns {Promise<void>}
   */
  async handle(_req, res) {
    if (!Application.isRunning()) {
      throw new ConflictError();
    }

    Application.pause();
    res.json({ status: 'pausing' });
  }
}

export { EnginePauseRequestHandler };

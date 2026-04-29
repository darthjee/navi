import { RequestHandler } from './RequestHandler.js';
import { Application } from '../services/Application.js';
import { ConflictError } from '../exceptions/ConflictError.js';

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
   * Starts engine processing from a stopped state, re-enqueueing initial jobs.
   * @param {object} _req - The Express request object.
   * @param {object} res - The Express response object.
   * @returns {Promise<void>}
   */
  async handle(_req, res) {
    if (!Application.isStopped()) {
      throw new ConflictError();
    }

    await Application.start();
    res.json({ status: 'running' });
  }
}

export { EngineStartRequestHandler };

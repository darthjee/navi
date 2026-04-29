import { RequestHandler } from './RequestHandler.js';
import { Application } from '../services/Application.js';

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
   * Resumes engine processing after a pause.
   * @param {object} _req - The Express request object.
   * @param {object} res - The Express response object.
   * @returns {Promise<void>}
   */
  async handle(_req, res) {
    if (Application.status() !== 'paused') {
      res.status(409).json({ error: 'Conflict', status: Application.status() });
      return;
    }

    await Application.continue();
    res.json({ status: 'running' });
  }
}

export { EngineContinueRequestHandler };

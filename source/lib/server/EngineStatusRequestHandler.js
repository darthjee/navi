import { RequestHandler } from './RequestHandler.js';
import { Application } from '../services/Application.js';

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
   * Responds with the current engine status.
   * @param {object} _req - The Express request object.
   * @param {object} res - The Express response object.
   * @returns {void}
   */
  handle(_req, res) {
    res.json({ status: Application.status() });
  }
}

export { EngineStatusRequestHandler };

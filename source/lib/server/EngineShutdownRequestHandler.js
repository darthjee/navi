import { RequestHandler } from './RequestHandler.js';
import { Application } from '../services/Application.js';

/**
 * Handles PATCH /engine/shutdown requests.
 * Shuts down the web server and stops the engine.
 * @author darthjee
 */
class EngineShutdownRequestHandler extends RequestHandler {
  /**
   * Creates a new EngineShutdownRequestHandler instance.
   */
  constructor() {
    super();
  }

  /**
   * Initiates server shutdown. Responds immediately with the transitional status.
   * @param {object} _req - The Express request object.
   * @param {object} res - The Express response object.
   * @returns {void}
   */
  handle(_req, res) {
    Application.shutdown();
    res.json({ status: 'stopping' });
  }
}

export { EngineShutdownRequestHandler };

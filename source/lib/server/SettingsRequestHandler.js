import { RequestHandler } from './RequestHandler.js';
import { ForbiddenError } from '../exceptions/ForbiddenError.js';

/**
 * Handles GET /settings.json requests.
 * Returns application settings visible to the frontend.
 * Throws ForbiddenError when shutdown is disabled.
 * @author darthjee
 */
class SettingsRequestHandler extends RequestHandler {
  #enableShutdown;

  /**
   * @param {object} [options={}]
   * @param {boolean} [options.enableShutdown=true] - Whether shutdown is permitted.
   */
  constructor({ enableShutdown = true } = {}) {
    super();
    this.#enableShutdown = enableShutdown;
  }

  /**
   * Responds with the application settings JSON.
   * @param {object} _req - The Express request object.
   * @param {object} res - The Express response object.
   * @returns {void}
   */
  handle(_req, res) {
    if (!this.#enableShutdown) throw new ForbiddenError();
    res.json({ enable_shutdown: true });
  }
}

export { SettingsRequestHandler };

import { RequestHandlerExecutor } from '../../common/server/RequestHandlerExecutor.js';
import { ForbiddenError } from '../../exceptions/http/ForbiddenError.js';

/**
 * Executes request-handling behaviour for GET /settings.json.
 * Throws ForbiddenError when shutdown is disabled.
 * @author darthjee
 */
class SettingsHandlerExecutor extends RequestHandlerExecutor {
  #response;
  #enableShutdown;

  /**
   * @param {object} _request - The Express request object.
   * @param {object} response - The Express response object.
   * @param {boolean} enableShutdown - Whether shutdown is permitted.
   */
  constructor(_request, response, enableShutdown) {
    super();
    this.#response = response;
    this.#enableShutdown = enableShutdown;
  }

  /**
   * Responds with the application settings JSON.
   * @returns {void}
   */
  handle() {
    if (!this.#enableShutdown) throw new ForbiddenError();
    this.#response.json({ enable_shutdown: true });
  }
}

export { SettingsHandlerExecutor };

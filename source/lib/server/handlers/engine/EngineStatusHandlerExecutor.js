import { RequestHandler } from '../../../common/server/RequestHandler.js';
import { Application } from '../../../services/Application.js';

/**
 * Executes request-handling behaviour for GET /engine/status.
 * @author darthjee
 */
class EngineStatusHandlerExecutor extends RequestHandler {
  #response;

  /**
   * @param {object} _request - The Express request object.
   * @param {object} response - The Express response object.
   */
  constructor(_request, response) {
    super();
    this.#response = response;
  }

  /**
   * Responds with the current engine status.
   * @returns {void}
   */
  handle() {
    this.#response.json({ status: Application.status() });
  }
}

export { EngineStatusHandlerExecutor };

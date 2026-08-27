import { RequestHandler } from '../../../common/server/RequestHandler.js';
import { EngineStopService } from '../../../services/engine/EngineStopService.js';

/**
 * Executes request-handling behaviour for PATCH /engine/stop.
 * @author darthjee
 */
class EngineStopHandler extends RequestHandler {
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
   * Initiates engine stop. Responds immediately with the transitional status.
   * @returns {Promise<void>}
   */
  async handle() {
    this.#response.json(EngineStopService.stop());
  }
}

export { EngineStopHandler };

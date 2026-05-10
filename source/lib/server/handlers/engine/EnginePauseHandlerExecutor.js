import { RequestHandler } from '../../../common/server/RequestHandler.js';
import { ConflictError } from '../../../exceptions/http/ConflictError.js';
import { Application } from '../../../services/Application.js';

/**
 * Executes request-handling behaviour for PATCH /engine/pause.
 * @author darthjee
 */
class EnginePauseHandlerExecutor extends RequestHandler {
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
   * Initiates engine pause. Responds immediately with the transitional status.
   * @returns {Promise<void>}
   */
  async handle() {
    if (!Application.isRunning()) throw new ConflictError();
    Application.pause();
    this.#response.json({ status: 'pausing' });
  }
}

export { EnginePauseHandlerExecutor };

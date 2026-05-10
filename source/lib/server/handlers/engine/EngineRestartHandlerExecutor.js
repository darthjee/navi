import { RequestHandlerExecutor } from '../../../common/server/RequestHandlerExecutor.js';
import { ConflictError } from '../../../exceptions/http/ConflictError.js';
import { Application } from '../../../services/Application.js';

/**
 * Executes request-handling behaviour for PATCH /engine/restart.
 * @author darthjee
 */
class EngineRestartHandlerExecutor extends RequestHandlerExecutor {
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
   * Initiates engine restart. Responds immediately with the transitional status.
   * @returns {Promise<void>}
   */
  async handle() {
    if (!Application.isRunning()) throw new ConflictError();
    Application.restart();
    this.#response.json({ status: 'stopping' });
  }
}

export { EngineRestartHandlerExecutor };

import { RequestHandlerExecutor } from '../../../common/server/RequestHandlerExecutor.js';
import { ConflictError } from '../../../exceptions/http/ConflictError.js';
import { Application } from '../../../services/Application.js';

/**
 * Executes request-handling behaviour for PATCH /engine/start.
 * @author darthjee
 */
class EngineStartHandlerExecutor extends RequestHandlerExecutor {
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
   * Starts engine processing from a stopped state.
   * @returns {Promise<void>}
   */
  async handle() {
    if (!Application.isStopped()) throw new ConflictError();
    await Application.start();
    this.#response.json({ status: 'running' });
  }
}

export { EngineStartHandlerExecutor };

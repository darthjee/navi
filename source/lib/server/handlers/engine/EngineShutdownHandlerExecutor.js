import { RequestHandlerExecutor } from '../../../common/server/RequestHandlerExecutor.js';
import { Application } from '../../../services/Application.js';

/**
 * Executes request-handling behaviour for PATCH /engine/shutdown.
 * @author darthjee
 */
class EngineShutdownHandlerExecutor extends RequestHandlerExecutor {
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
   * Initiates server shutdown. Responds immediately with the transitional status.
   * @returns {void}
   */
  handle() {
    Application.shutdown();
    this.#response.json({ status: 'stopping' });
  }
}

export { EngineShutdownHandlerExecutor };

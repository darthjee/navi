import { RequestHandler } from '../common/server/RequestHandler.js';
import { Logger } from '../common/utils/logging/Logger.js';

/**
 * Executes request-handling behaviour for the demo collector (emit target) endpoint.
 * Logs the received emission and responds with 204 — no persistence, no read-back.
 */
class CollectorHandler extends RequestHandler {
  #request;
  #response;

  /**
   * @param {import('express').Request} request
   * @param {import('express').Response} response
   */
  constructor(request, response) {
    super();
    this.#request = request;
    this.#response = response;
  }

  /**
   * Logs `{ source, body }` and responds 204.
   * @returns {void}
   */
  handle() {
    const { source } = this.#request.params;
    const body = this.#request.body ?? {};
    Logger.info('CollectorHandler: received emission', { source, body });
    this.#response.status(204).end();
  }
}

export default CollectorHandler;

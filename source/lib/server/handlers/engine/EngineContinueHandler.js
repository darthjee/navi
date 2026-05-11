import { RequestHandler } from '../../../common/server/RequestHandler.js';
import { ConflictError } from '../../../exceptions/http/ConflictError.js';
import { Application } from '../../../services/Application.js';

/**
 * Executes request-handling behaviour for PATCH /engine/continue.
 * @author darthjee
 */
class EngineContinueHandler extends RequestHandler {
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
   * Resumes engine processing after a pause.
   * @returns {Promise<void>}
   */
  async handle() {
    if (!Application.isPaused()) throw new ConflictError();
    await Application.continue();
    this.#response.json({ status: 'running' });
  }
}

export { EngineContinueHandler };

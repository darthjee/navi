import { RequestHandler } from '../../../common/server/RequestHandler.js';
import { ConflictError } from '../../../exceptions/http/ConflictError.js';
import { Application } from '../../../services/Application.js';

/**
 * Executes request-handling behaviour for PATCH /engine/start.
 * @author darthjee
 */
class EngineStartHandler extends RequestHandler {
  #request;
  #response;

  /**
   * @param {object} request - The Express request object.
   * @param {object} response - The Express response object.
   */
  constructor(request, response) {
    super();
    this.#request = request;
    this.#response = response;
  }

  /**
   * Starts engine processing from a stopped state, or pushes resources into an
   * already-running engine. The request body may name which resources to
   * enqueue (`{ resources: [...] }`); when omitted, all parameter-free
   * resources are enqueued.
   * @returns {Promise<void>}
   */
  async handle() {
    const resources = Array.isArray(this.#request.body?.resources) ? this.#request.body.resources : [];

    if (Application.isStopped()) {
      const result = await Application.start(resources);
      this.#response.json({ status: 'running', ...result });
      return;
    }

    if (Application.isRunning()) {
      const result = Application.enqueueResources(resources);
      this.#response.json({ status: 'running', ...result });
      return;
    }

    throw new ConflictError();
  }
}

export { EngineStartHandler };

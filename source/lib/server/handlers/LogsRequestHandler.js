import { RequestHandler } from '../../common/server/RequestHandler.js';
import { LogsHandlerExecutor } from './LogsHandlerExecutor.js';

/**
 * Handles GET /logs.json requests.
 * Routes to per-job or per-worker buffers via optional `jobId` / `workerId` query params.
 * Returns 400 when both params are present simultaneously.
 * @author darthjee
 */
class LogsRequestHandler extends RequestHandler {
  #pageSize;

  /**
   * Creates a new LogsRequestHandler.
   * @param {object} [options={}] - Constructor options.
   * @param {number} [options.pageSize=20] - Maximum number of log entries to return.
   */
  constructor({ pageSize = 20 } = {}) {
    super();
    this.#pageSize = pageSize;
  }

  /**
   * Delegates to LogsHandlerExecutor.
   * @param {object} req - The Express request object.
   * @param {object} res - The Express response object.
   * @returns {void}
   */
  handle(req, res) {
    new LogsHandlerExecutor(req, res, this.#pageSize).handle();
  }
}

export { LogsRequestHandler };

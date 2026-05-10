import { RequestHandler } from '../../../common/server/RequestHandler.js';
import { JobLogsHandlerExecutor } from './JobLogsHandlerExecutor.js';

/**
 * Handles GET /jobs/:job_id/logs.json requests.
 * Returns a paginated list of log entries for the given job, optionally
 * filtered to entries newer than last_id.
 * An unknown job_id returns an empty array.
 * @author darthjee
 */
class JobLogsRequestHandler extends RequestHandler {
  #pageSize;

  /**
   * Creates a new JobLogsRequestHandler.
   * @param {object} [options={}] - Constructor options.
   * @param {number} [options.pageSize=20] - Maximum number of log entries to return.
   */
  constructor({ pageSize = 20 } = {}) {
    super();
    this.#pageSize = pageSize;
  }

  /**
   * Delegates to JobLogsHandlerExecutor.
   * @param {object} req - The Express request object.
   * @param {object} res - The Express response object.
   * @returns {void}
   */
  handle(req, res) {
    new JobLogsHandlerExecutor(req, res, this.#pageSize).handle();
  }
}

export { JobLogsRequestHandler };

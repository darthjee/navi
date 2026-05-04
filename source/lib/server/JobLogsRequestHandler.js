import { RequestHandler } from './RequestHandler.js';
import { LogRegistry } from '../registry/LogRegistry.js';
import { LogSerializer } from '../serializers/LogSerializer.js';

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
   * Responds with a paginated JSON array of log entries for the given job.
   * @param {object} req - The Express request object.
   * @param {object} res - The Express response object.
   * @returns {void}
   */
  handle(req, res) {
    const { job_id: jobId } = req.params;
    const { last_id: lastId } = req.query;
    const logs = LogRegistry.getLogsByJobId(jobId, { lastId });
    res.json(LogSerializer.serialize(logs.slice(0, this.#pageSize)));
  }
}

export { JobLogsRequestHandler };

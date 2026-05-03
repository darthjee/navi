import { RequestHandler } from './RequestHandler.js';
import { LogRegistry } from '../registry/LogRegistry.js';
import { LogSerializer } from '../serializers/LogSerializer.js';

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
   * @param {object} [options={}]
   * @param {number} [options.pageSize=20] - Maximum number of log entries to return.
   */
  constructor({ pageSize = 20 } = {}) {
    super();
    this.#pageSize = pageSize;
  }

  /**
   * Responds with a paginated JSON array of log entries.
   * @param {object} req - The Express request object.
   * @param {object} res - The Express response object.
   * @returns {void}
   */
  handle(req, res) {
    const { last_id: lastId, jobId, workerId } = req.query;

    if (jobId && workerId) {
      res.status(400).json({ error: 'Cannot specify both jobId and workerId' });
      return;
    }

    if (jobId) {
      const logs = LogRegistry.getLogsByJobId(jobId);
      res.json(LogSerializer.serialize(logs.slice(0, this.#pageSize)));
      return;
    }

    if (workerId) {
      const logs = LogRegistry.getLogsByWorkerId(workerId);
      res.json(LogSerializer.serialize(logs.slice(0, this.#pageSize)));
      return;
    }

    const logs = LogRegistry.getLogs({ lastId });
    res.json(LogSerializer.serialize(logs.slice(0, this.#pageSize)));
  }
}

export { LogsRequestHandler };

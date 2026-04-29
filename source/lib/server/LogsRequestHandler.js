import { RequestHandler } from './RequestHandler.js';
import { LogRegistry } from '../registry/LogRegistry.js';

/**
 * Handles GET /logs.json requests.
 * Returns a paginated list of log entries, optionally filtered to entries newer than last_id.
 * @author darthjee
 */
class LogsRequestHandler extends RequestHandler {
  #pageSize;

  /**
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
    const { last_id: lastId } = req.query;
    const logs = LogRegistry.getLogs({ lastId });
    res.json(logs.slice(0, this.#pageSize).map(log => log.toJSON()));
  }
}

export { LogsRequestHandler };

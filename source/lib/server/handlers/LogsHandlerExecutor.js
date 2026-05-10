import { RequestHandlerExecutor } from '../../common/server/RequestHandlerExecutor.js';
import { LogRegistry } from '../../registry/LogRegistry.js';
import { LogSerializer } from '../../serializers/LogSerializer.js';

/**
 * Executes request-handling behaviour for GET /logs.json.
 * Routes to per-job or per-worker buffers via optional query params.
 * Returns 400 when both jobId and workerId are present simultaneously.
 * @author darthjee
 */
class LogsHandlerExecutor extends RequestHandlerExecutor {
  #request;
  #response;
  #pageSize;

  /**
   * @param {object} request - The Express request object.
   * @param {object} response - The Express response object.
   * @param {number} pageSize - Maximum number of log entries to return.
   */
  constructor(request, response, pageSize) {
    super();
    this.#request = request;
    this.#response = response;
    this.#pageSize = pageSize;
  }

  /**
   * Responds with a paginated JSON array of log entries.
   * @returns {void}
   */
  handle() {
    const { last_id: lastId, jobId, workerId } = this.#request.query;

    if (jobId && workerId) {
      this.#response.status(400).json({ error: 'Cannot specify both jobId and workerId' });
      return;
    }

    if (jobId) {
      const logs = LogRegistry.getLogsByJobId(jobId);
      this.#response.json(LogSerializer.serialize(logs.slice(0, this.#pageSize)));
      return;
    }

    if (workerId) {
      const logs = LogRegistry.getLogsByWorkerId(workerId);
      this.#response.json(LogSerializer.serialize(logs.slice(0, this.#pageSize)));
      return;
    }

    const logs = LogRegistry.getLogs({ lastId });
    this.#response.json(LogSerializer.serialize(logs.slice(0, this.#pageSize)));
  }
}

export { LogsHandlerExecutor };

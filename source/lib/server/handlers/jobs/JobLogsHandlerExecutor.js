import { RequestHandlerExecutor } from '../../../common/server/RequestHandlerExecutor.js';
import { LogRegistry } from '../../../registry/LogRegistry.js';
import { LogSerializer } from '../../../serializers/LogSerializer.js';

/**
 * Executes request-handling behaviour for GET /jobs/:job_id/logs.json.
 * @author darthjee
 */
class JobLogsHandlerExecutor extends RequestHandlerExecutor {
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
   * Responds with a paginated JSON array of log entries for the given job.
   * @returns {void}
   */
  handle() {
    const { job_id: jobId } = this.#request.params;
    const { last_id: lastId } = this.#request.query;
    const logs = LogRegistry.getLogsByJobId(jobId, { lastId });
    this.#response.json(LogSerializer.serialize(logs.slice(0, this.#pageSize)));
  }
}

export { JobLogsHandlerExecutor };

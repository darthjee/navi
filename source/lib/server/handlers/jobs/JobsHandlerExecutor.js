import { JobRegistry } from '../../../background/JobRegistry.js';
import { RequestHandler } from '../../../common/server/RequestHandler.js';
import { JobSerializer } from '../../../serializers/JobSerializer.js';
import { JobsFilter } from '../JobsFilter.js';

/**
 * Executes request-handling behaviour for GET /jobs/:status.json.
 * @author darthjee
 */
class JobsHandlerExecutor extends RequestHandler {
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
   * Responds with the list of jobs in the given status queue.
   * @returns {void}
   */
  handle() {
    const { status } = this.#request.params;
    const jobs = JobRegistry.jobsByStatus(status);
    const filters = this.#request.query.filters || {};
    const filteredJobs = new JobsFilter(jobs, filters).filter();
    this.#response.json(JobSerializer.serialize(filteredJobs, { status, view: 'index' }));
  }
}

export { JobsHandlerExecutor };

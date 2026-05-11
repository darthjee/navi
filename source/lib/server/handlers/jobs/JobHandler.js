import { JobRegistry } from '../../../background/JobRegistry.js';
import { RequestHandler } from '../../../common/server/RequestHandler.js';
import { NotFoundError } from '../../../exceptions/http/NotFoundError.js';
import { JobSerializer } from '../../../serializers/JobSerializer.js';

/**
 * Executes request-handling behaviour for GET /job/:id.json.
 * @author darthjee
 */
class JobHandler extends RequestHandler {
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
   * Responds with the job details for the given ID, or 404 if not found.
   * @returns {void}
   */
  handle() {
    const result = JobRegistry.jobById(this.#request.params.id);
    if (!result) throw new NotFoundError('Job not found');
    this.#response.json(JobSerializer.serialize(result.job, { status: result.status, view: 'show' }));
  }
}

export { JobHandler };

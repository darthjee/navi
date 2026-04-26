import { NotFoundError } from '../exceptions/NotFoundError.js';
import { RequestHandler } from './RequestHandler.js';
import { JobRegistry } from '../registry/JobRegistry.js';
import { JobSerializer } from '../serializers/JobSerializer.js';

/**
 * Handles GET /job/:id.json requests.
 * @author darthjee
 */
class JobRequestHandler extends RequestHandler {
  /**
   * Creates a new JobRequestHandler instance.
   */
  constructor() {
    super();
  }

  /**
   * Responds with the job details for the given ID, or 404 if not found.
   * @param {object} req - The Express request object.
   * @param {object} res - The Express response object.
   * @returns {void}
   */
  handle(req, res) {
    const result = JobRegistry.jobById(req.params.id);
    if (!result) {
      throw new NotFoundError('Job not found');
    }
    res.json(JobSerializer.serialize(result.job, { status: result.status }));
  }
}

export { JobRequestHandler };

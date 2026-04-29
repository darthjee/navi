import { RequestHandler } from './RequestHandler.js';
import { JobRegistry } from '../background/JobRegistry.js';
import { JobSerializer } from '../serializers/JobSerializer.js';

/**
 * Handles GET /jobs/:status.json requests.
 * @author darthjee
 */
class JobsRequestHandler extends RequestHandler {
  /**
   * Creates a new JobsRequestHandler instance.
   */
  constructor() {
    super();
  }

  /**
   * Responds with the list of jobs in the given status queue.
   * @param {object} req - The Express request object.
   * @param {object} res - The Express response object.
   * @returns {void}
   */
  handle(req, res) {
    const { status } = req.params;
    const jobs = JobRegistry.jobsByStatus(status);
    res.json(JobSerializer.serialize(jobs, { status, view: 'index' }));
  }
}

export { JobsRequestHandler };

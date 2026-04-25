import { RequestHandler } from './RequestHandler.js';
import { JobRegistry } from '../registry/JobRegistry.js';

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
    res.json(JobRegistry.jobsByStatus(req.params.status));
  }
}

export { JobsRequestHandler };

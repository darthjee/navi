import { RequestHandler } from './RequestHandler.js';
import { JobRegistry } from '../registry/JobRegistry.js';

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
    const job = JobRegistry.jobById(req.params.id);
    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }
    res.json(job);
  }
}

export { JobRequestHandler };

import { JobRegistry } from '../background/JobRegistry.js';
import { ConflictError } from '../exceptions/ConflictError.js';
import { NotFoundError } from '../exceptions/NotFoundError.js';
import { RequestHandler } from './RequestHandler.js';

const RETRYABLE_STATUSES = new Set(['failed', 'dead']);

/**
 * Handles PATCH /jobs/:id/retry requests.
 * Moves a failed or dead job directly to the retry queue.
 * Returns 404 if the job does not exist, 409 if it is not in a retryable state.
 * @author darthjee
 */
class JobRetryRequestHandler extends RequestHandler {
  /**
   * Creates a new JobRetryRequestHandler instance.
   */
  constructor() {
    super();
  }

  /**
   * Retries the specified job by moving it to the retry queue.
   * @param {object} req - The Express request object.
   * @param {object} res - The Express response object.
   * @returns {void}
   */
  handle(req, res) {
    const { id } = req.params;
    const result = JobRegistry.jobById(id);

    if (!result) throw new NotFoundError('Job not found');
    if (!RETRYABLE_STATUSES.has(result.status)) throw new ConflictError();

    JobRegistry.retryJob(id);
    res.json({ status: 'enqueued' });
  }
}

export { JobRetryRequestHandler };

import { RequestHandler } from '../../../common/server/RequestHandler.js';
import { JobRetryHandlerExecutor } from './JobRetryHandlerExecutor.js';

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
   * Delegates to JobRetryHandlerExecutor.
   * @param {object} req - The Express request object.
   * @param {object} res - The Express response object.
   * @returns {void}
   */
  handle(req, res) {
    new JobRetryHandlerExecutor(req, res).handle();
  }
}

export { JobRetryRequestHandler };

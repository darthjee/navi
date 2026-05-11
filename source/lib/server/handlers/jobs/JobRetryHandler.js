import { JobRegistry } from '../../../background/JobRegistry.js';
import { RequestHandler } from '../../../common/server/RequestHandler.js';
import { ConflictError } from '../../../exceptions/http/ConflictError.js';
import { NotFoundError } from '../../../exceptions/http/NotFoundError.js';

const RETRYABLE_STATUSES = new Set(['failed', 'dead']);

/**
 * Executes request-handling behaviour for PATCH /jobs/:id/retry.
 * @author darthjee
 */
class JobRetryHandler extends RequestHandler {
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
   * Retries the specified job by moving it to the retry queue.
   * @returns {void}
   */
  handle() {
    const { id } = this.#request.params;
    const result = JobRegistry.jobById(id);

    if (!result) throw new NotFoundError('Job not found');
    if (!RETRYABLE_STATUSES.has(result.status)) throw new ConflictError();

    JobRegistry.retryJob(id);
    this.#response.json({ status: 'enqueued' });
  }
}

export { JobRetryHandler };

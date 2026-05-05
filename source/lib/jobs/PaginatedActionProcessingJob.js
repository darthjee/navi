import { Job } from '../background/Job.js';

/**
 * Processes a single paginated action for a given response wrapper.
 * Exhausted after the first failure — no retry rights.
 * @author darthjee
 * @augments Job
 */
class PaginatedActionProcessingJob extends Job {
  #paginatedAction;
  #parameters;

  /**
   * Creates a new PaginatedActionProcessingJob instance.
   * @param {object} params The parameters for creating a PaginatedActionProcessingJob instance.
   * @param {string} params.id Unique job identifier.
   * @param {ResourceRequestPaginatedAction} params.paginatedAction The paginated action to execute.
   * @param {ResponseWrapper} params.parameters The response wrapper carrying response data and original request parameters.
   */
  constructor({ id, paginatedAction, parameters }) {
    super({ id });
    this.#paginatedAction = paginatedAction;
    this.#parameters = parameters;
  }

  /**
   * Returns the job-specific arguments for serialization.
   * @returns {{ parameters: ResponseWrapper }} The job arguments.
   */
  get arguments() {
    return { parameters: this.#parameters };
  }

  /**
   * Returns the maximum number of retries for this job type.
   * PaginatedActionProcessingJob is exhausted after the first failure.
   * @returns {number} Always 1.
   * @override
   */
  get maxRetries() {
    return 1;
  }

  /**
   * Performs the paginated action for the given parameters.
   * @param {LogContext} logContext - Context carrying workerId/jobId for log entries.
   * @returns {Promise<void>}
   */
  async perform(logContext) {
    logContext.debug(`PaginatedActionProcessingJob #${this.id} performing`);
    try {
      this.lastError = undefined;
      await this.#paginatedAction.execute(this.#parameters);
    } catch (error) {
      this._fail(error);
    }
  }
}

export { PaginatedActionProcessingJob };

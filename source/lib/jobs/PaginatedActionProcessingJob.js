import { Job } from '../background/Job.js';

/**
 * Processes a single paginated action for a given response item.
 * Exhausted after the first failure — no retry rights.
 * @author darthjee
 * @augments Job
 */
class PaginatedActionProcessingJob extends Job {
  #paginatedAction;
  #item;

  /**
   * @param {object} params
   * @param {string} params.id Unique job identifier.
   * @param {ResourceRequestPaginatedAction} params.paginatedAction The paginated action to execute.
   * @param {ResponseWrapper} params.item The response item to process.
   */
  constructor({ id, paginatedAction, item }) {
    super({ id });
    this.#paginatedAction = paginatedAction;
    this.#item = item;
  }

  /**
   * Returns the job-specific arguments for serialization.
   * @returns {{ item: ResponseWrapper }}
   */
  get arguments() {
    return { item: this.#item };
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
   * Performs the paginated action for the given item.
   * @param {LogContext} logContext - Context carrying workerId/jobId for log entries.
   * @returns {Promise<void>}
   */
  async perform(logContext) {
    logContext.debug(`PaginatedActionProcessingJob #${this.id} performing`);
    try {
      this.lastError = undefined;
      await this.#paginatedAction.execute(this.#item);
    } catch (error) {
      this._fail(error);
    }
  }
}

export { PaginatedActionProcessingJob };

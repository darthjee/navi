import { Job } from '../background/Job.js';

/**
 * Processes a single paginated action for a given response wrapper.
 * Exhausted after the first failure — no retry rights.
 * @author darthjee
 * @augments Job
 */
class PaginatedActionProcessingJob extends Job {
  #paginatedAction;
  #responseWrapper;
  #parameters;
  #originUrl;

  /**
   * Creates a new PaginatedActionProcessingJob instance.
   * @param {object} params The parameters for creating a PaginatedActionProcessingJob instance.
   * @param {string} params.id Unique job identifier.
   * @param {ResourceRequestPaginatedAction} params.paginatedAction The paginated action to execute.
   * @param {ResponseWrapper} params.responseWrapper The response wrapper carrying response data.
   * @param {object} [params.parameters={}] The original request parameters (key-value map for URL template resolution).
   * @param {string|null} [params.originUrl=null] The URL of the ResourceRequestJob that triggered this job.
   */
  constructor({ id, paginatedAction, responseWrapper, parameters = {}, originUrl = null }) {
    super({ id });
    this.#paginatedAction = paginatedAction;
    this.#responseWrapper = responseWrapper;
    this.#parameters = parameters;
    this.#originUrl = originUrl;
  }

  /**
   * Returns the job-specific arguments for serialization.
   * @returns {{ responseWrapper: ResponseWrapper, parameters: object, originUrl?: string }} The job arguments.
   */
  get arguments() {
    return { responseWrapper: this.#responseWrapper, parameters: this.#parameters, ...this.#originUrlField() };
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
   * Performs the paginated action for the given response wrapper and parameters.
   * @param {LogContext} logContext - Context carrying workerId/jobId for log entries.
   * @returns {Promise<void>}
   */
  async perform(logContext) {
    logContext.debug(`PaginatedActionProcessingJob #${this.id} performing`);
    try {
      this.lastError = undefined;
      await this.#paginatedAction.execute(this.#responseWrapper, this.#parameters);
    } catch (error) {
      this._fail(error);
    }
  }

  /**
   * Returns an object containing the originUrl field when an origin URL is set,
   * or an empty object otherwise.
   * @returns {{ originUrl: string }|{}} The origin URL field or empty object.
   * @private
   */
  #originUrlField() {
    return this.#originUrl !== null ? { originUrl: this.#originUrl } : {};
  }

}

export { PaginatedActionProcessingJob };

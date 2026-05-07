import { JobRegistry as DefaultJobRegistry } from '../background/JobRegistry.js';
import { Application } from '../services/Application.js';

/**
 * Enqueues one PaginatedActionProcessingJob for a single paginated action.
 * @author darthjee
 */
class PaginatedActionEnqueuer {
  #paginatedAction;
  #responseWrapper;
  #parameters;
  #jobRegistry;
  #originUrl;

  /**
   * @param {ResourceRequestPaginatedAction} paginatedAction The paginated action to enqueue.
   * @param {ResponseWrapper} responseWrapper The response wrapper carrying response data.
   * @param {object} [parameters={}] The original request parameters (key-value map for URL template resolution).
   * @param {object} [jobRegistry=JobRegistry] The job registry to enqueue jobs to.
   * @param {string|null} [originUrl=null] The URL of the ResourceRequestJob that triggered this enqueue.
   */
  constructor(paginatedAction, responseWrapper, parameters = {}, jobRegistry = DefaultJobRegistry, originUrl = null) {
    this.#paginatedAction = paginatedAction;
    this.#responseWrapper = responseWrapper;
    this.#parameters = parameters;
    this.#jobRegistry = jobRegistry;
    this.#originUrl = originUrl;
  }

  /**
   * Enqueues one PaginatedActionProcessingJob for the configured paginated action.
   * Does nothing if the application is in 'stopped' status.
   * @returns {void}
   */
  enqueue() {
    if (Application.isStopped()) return;
    this.#jobRegistry.enqueue('PaginatedAction', this.#buildParams());
  }

  /**
   * Builds the job params object, including originUrl when present.
   * @returns {object} The params object for the job registry.
   * @private
   */
  #buildParams() {
    const params = { paginatedAction: this.#paginatedAction, responseWrapper: this.#responseWrapper, parameters: this.#parameters };
    if (this.#originUrl !== null) params.originUrl = this.#originUrl;
    return params;
  }

}

export { PaginatedActionEnqueuer };

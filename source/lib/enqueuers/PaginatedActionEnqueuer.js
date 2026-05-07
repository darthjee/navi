import { JobRegistry as DefaultJobRegistry } from '../background/JobRegistry.js';
import { Application } from '../services/Application.js';

/**
 * Enqueues one PaginatedActionProcessingJob for a single paginated action.
 * @author darthjee
 */
class PaginatedActionEnqueuer {
  #paginatedAction;
  #parameters;
  #jobRegistry;
  #originUrl;

  /**
   * @param {ResourceRequestPaginatedAction} paginatedAction The paginated action to enqueue.
   * @param {ResponseWrapper} parameters The response wrapper carrying response data and original request parameters.
   * @param {object} [jobRegistry=JobRegistry] The job registry to enqueue jobs to.
   * @param {string|null} [originUrl=null] The URL of the ResourceRequestJob that triggered this enqueue.
   */
  constructor(paginatedAction, parameters, jobRegistry = DefaultJobRegistry, originUrl = null) {
    this.#paginatedAction = paginatedAction;
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
    const params = { paginatedAction: this.#paginatedAction, parameters: this.#parameters };
    if (this.#originUrl !== null) params.originUrl = this.#originUrl;
    this.#jobRegistry.enqueue('PaginatedAction', params);
  }
}

export { PaginatedActionEnqueuer };

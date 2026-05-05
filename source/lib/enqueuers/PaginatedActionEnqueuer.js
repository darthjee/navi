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

  /**
   * @param {ResourceRequestPaginatedAction} paginatedAction The paginated action to enqueue.
   * @param {ResponseWrapper} parameters The response wrapper carrying response data and original request parameters.
   * @param {object} [jobRegistry=JobRegistry] The job registry to enqueue jobs to.
   */
  constructor(paginatedAction, parameters, jobRegistry = DefaultJobRegistry) {
    this.#paginatedAction = paginatedAction;
    this.#parameters = parameters;
    this.#jobRegistry = jobRegistry;
  }

  /**
   * Enqueues one PaginatedActionProcessingJob for the configured paginated action.
   * Does nothing if the application is in 'stopped' status.
   * @returns {void}
   */
  enqueue() {
    if (Application.isStopped()) return;
    this.#jobRegistry.enqueue('PaginatedAction', { paginatedAction: this.#paginatedAction, parameters: this.#parameters });
  }
}

export { PaginatedActionEnqueuer };

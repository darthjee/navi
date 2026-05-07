import { PaginatedActionEnqueuer } from './PaginatedActionEnqueuer.js';
import { NullResponse } from '../exceptions/request/NullResponse.js';

/**
 * Enqueues one PaginatedActionProcessingJob per paginated action for the given parameters.
 *
 * Delegates execution to the job queue instead of running paginated actions inline.
 * Each paginated action is handled by a dedicated PaginatedActionEnqueuer.
 * @author darthjee
 */
class PaginatedActionsEnqueuer {
  #paginatedActions;
  #parameters;
  #jobRegistry;
  #originUrl;

  /**
   * @param {Array<ResourceRequestPaginatedAction>} paginatedActions List of paginated action instances.
   * @param {ResponseWrapper} parameters The response wrapper carrying response data and original request parameters.
   * @param {object} [jobRegistry] The job registry to enqueue jobs to. Defaults to global JobRegistry.
   * @param {string|null} [originUrl=null] The URL of the ResourceRequestJob that triggered this enqueue.
   */
  constructor(paginatedActions, parameters, jobRegistry, originUrl = null) {
    this.#paginatedActions = paginatedActions;
    this.#parameters = parameters;
    this.#jobRegistry = jobRegistry;
    this.#originUrl = originUrl;
  }

  /**
   * Enqueues one PaginatedActionProcessingJob per paginated action.
   * @returns {void}
   * @throws {NullResponse} If the parameters are null.
   */
  enqueue() {
    if (this.#parameters === null) throw new NullResponse();

    for (const paginatedAction of this.#paginatedActions) {
      new PaginatedActionEnqueuer(paginatedAction, this.#parameters, this.#jobRegistry, this.#originUrl).enqueue();
    }
  }
}

export { PaginatedActionsEnqueuer };

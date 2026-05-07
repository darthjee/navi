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
  #responseWrapper;
  #parameters;
  #jobRegistry;
  #originUrl;

  /**
   * @param {Array<ResourceRequestPaginatedAction>} paginatedActions List of paginated action instances.
   * @param {ResponseWrapper} responseWrapper The response wrapper carrying response data.
   * @param {object} [parameters={}] The original request parameters (key-value map for URL template resolution).
   * @param {object} [jobRegistry] The job registry to enqueue jobs to. Defaults to global JobRegistry.
   * @param {string|null} [originUrl=null] The URL of the ResourceRequestJob that triggered this enqueue.
   */
  constructor(paginatedActions, responseWrapper, parameters = {}, jobRegistry, originUrl = null) {
    this.#paginatedActions = paginatedActions;
    this.#responseWrapper = responseWrapper;
    this.#parameters = parameters;
    this.#jobRegistry = jobRegistry;
    this.#originUrl = originUrl;
  }

  /**
   * Enqueues one PaginatedActionProcessingJob per paginated action.
   * @returns {void}
   * @throws {NullResponse} If the responseWrapper is null.
   */
  enqueue() {
    if (this.#responseWrapper === null) throw new NullResponse();

    for (const paginatedAction of this.#paginatedActions) {
      new PaginatedActionEnqueuer(paginatedAction, this.#responseWrapper, this.#parameters, this.#jobRegistry, this.#originUrl).enqueue();
    }
  }
}

export { PaginatedActionsEnqueuer };

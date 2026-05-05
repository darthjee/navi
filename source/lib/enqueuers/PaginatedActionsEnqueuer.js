import { PaginatedActionEnqueuer } from './PaginatedActionEnqueuer.js';
import { NullResponse } from '../exceptions/NullResponse.js';

/**
 * Enqueues one PaginatedActionProcessingJob per (item × paginatedAction) pair.
 * @author darthjee
 */
class PaginatedActionsEnqueuer {
  #paginatedActions;
  #items;
  #jobRegistry;

  /**
   * @param {Array<ResourceRequestPaginatedAction>} paginatedActions
   * @param {Array<ResponseWrapper>} items
   * @param {object} [jobRegistry]
   */
  constructor(paginatedActions, items, jobRegistry) {
    this.#paginatedActions = paginatedActions;
    this.#items = items;
    this.#jobRegistry = jobRegistry;
  }

  /**
   * Enqueues one PaginatedActionProcessingJob per (paginatedAction × item) pair.
   * @returns {void}
   * @throws {NullResponse} If the items list is null.
   */
  enqueue() {
    if (this.#items === null) throw new NullResponse();

    for (const paginatedAction of this.#paginatedActions) {
      new PaginatedActionEnqueuer(paginatedAction, this.#items, this.#jobRegistry).enqueue();
    }
  }
}

export { PaginatedActionsEnqueuer };

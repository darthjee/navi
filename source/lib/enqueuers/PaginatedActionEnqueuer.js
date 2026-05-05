import { JobRegistry as DefaultJobRegistry } from '../background/JobRegistry.js';
import { Application } from '../services/Application.js';

/**
 * Enqueues one PaginatedActionProcessingJob per item for a single paginated action.
 * @author darthjee
 */
class PaginatedActionEnqueuer {
  #paginatedAction;
  #items;
  #jobRegistry;

  /**
   * @param {ResourceRequestPaginatedAction} paginatedAction
   * @param {Array<ResponseWrapper>} items
   * @param {object} [jobRegistry=JobRegistry]
   */
  constructor(paginatedAction, items, jobRegistry = DefaultJobRegistry) {
    this.#paginatedAction = paginatedAction;
    this.#items = items;
    this.#jobRegistry = jobRegistry;
  }

  /**
   * Enqueues one PaginatedActionProcessingJob per item.
   * Does nothing if the application is stopped.
   * @returns {void}
   */
  enqueue() {
    if (Application.isStopped()) return;
    for (const item of this.#items) {
      this.#jobRegistry.enqueue('PaginatedAction', { paginatedAction: this.#paginatedAction, item });
    }
  }
}

export { PaginatedActionEnqueuer };

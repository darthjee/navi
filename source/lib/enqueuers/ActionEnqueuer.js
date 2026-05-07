import { JobRegistry as DefaultJobRegistry } from '../background/JobRegistry.js';
import { Application } from '../services/Application.js';

/**
 * ActionEnqueuer enqueues one ActionProcessingJob per item for a single Action.
 * @author darthjee
 */
class ActionEnqueuer {
  #action;
  #items;
  #jobRegistry;
  #originUrl;

  /**
   * @param {ResourceRequestAction} action The action to enqueue for each item.
   * @param {Array} items List of parsed response items.
   * @param {object} [jobRegistry=JobRegistry] The job registry to enqueue jobs to.
   * @param {string|null} [originUrl=null] The URL of the ResourceRequestJob that triggered this enqueue.
   */
  constructor(action, items, jobRegistry = DefaultJobRegistry, originUrl = null) {
    this.#action = action;
    this.#items = items;
    this.#jobRegistry = jobRegistry;
    this.#originUrl = originUrl;
  }

  /**
   * Enqueues one ActionProcessingJob per item for the configured action.
   * Does nothing if the application is in 'stopped' status.
   * @returns {void}
   */
  enqueue() {
    if (Application.isStopped()) return;
    for (const item of this.#items) {
      this.#jobRegistry.enqueue('Action', this.#buildParams(item));
    }
  }

  /**
   * Builds the job params object for a single item, including originUrl when present.
   * @param {object} item The parsed response item.
   * @returns {object} The params object for the job registry.
   * @private
   */
  #buildParams(item) {
    const params = { action: this.#action, item };
    if (this.#originUrl !== null) params.originUrl = this.#originUrl;
    return params;
  }

}

export { ActionEnqueuer };

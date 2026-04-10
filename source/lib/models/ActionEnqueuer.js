import { JobRegistry } from '../registry/JobRegistry.js';

/**
 * ActionEnqueuer enqueues one ActionProcessingJob per item for a single Action.
 * @author darthjee
 */
class ActionEnqueuer {
  #action;
  #items;

  /**
   * @param {ResourceRequestAction} action The action to enqueue for each item.
   * @param {Array} items List of parsed response items.
   */
  constructor(action, items) {
    this.#action = action;
    this.#items = items;
  }

  /**
   * Enqueues one ActionProcessingJob per item for the configured action.
   */
  enqueue() {
    for (const item of this.#items) {
      JobRegistry.enqueue('Action', { action: this.#action, item });
    }
  }
}

export { ActionEnqueuer };

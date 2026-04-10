/**
 * ActionEnqueuer enqueues one ActionProcessingJob per item for a single Action.
 * @author darthjee
 */
class ActionEnqueuer {
  #action;
  #items;
  #jobRegistry;

  /**
   * @param {ResourceRequestAction} action The action to enqueue for each item.
   * @param {Array} items List of parsed response items.
   * @param {JobRegistry} jobRegistry The registry used to enqueue action jobs.
   */
  constructor(action, items, jobRegistry) {
    this.#action = action;
    this.#items = items;
    this.#jobRegistry = jobRegistry;
  }

  /**
   * Enqueues one ActionProcessingJob per item for the configured action.
   */
  enqueue() {
    for (const item of this.#items) {
      this.#jobRegistry.enqueue('Action', { action: this.#action, item });
    }
  }
}

export { ActionEnqueuer };

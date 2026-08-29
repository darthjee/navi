import { PromiseAggregator } from '../../utils/PromiseAggregator.js';

/**
 * StartupCoordinator owns a `PromiseAggregator` internally and starts a given
 * list of controllers uniformly, registering each controller's `start()`
 * result with the aggregator on `ApplicationInstance`'s behalf.
 * @author darthjee
 */
class StartupCoordinator {
  #aggregator;

  /**
   * @param {object} [params={}] - Dependency injection parameters.
   * @param {PromiseAggregator} [params.aggregator] - Promise aggregator (injected for testing).
   */
  constructor({ aggregator } = {}) {
    this.#aggregator = aggregator ?? new PromiseAggregator();
  }

  /**
   * Calls `start()` on each given controller, in order, and registers the
   * resulting promise (if any) with the internal aggregator. A synchronous
   * throw from one controller's `start()` propagates immediately, preventing
   * later controllers in the list from starting.
   * @param {Array<{start: Function}>} controllers - The controllers to start, in order.
   * @returns {void}
   */
  startAll(controllers) {
    for (const controller of controllers) {
      this.#aggregator.add(controller.start());
    }
  }

  /**
   * Waits for all registered controller start promises to settle.
   * @returns {Promise<void>}
   */
  async wait() {
    return this.#aggregator.wait();
  }
}

export { StartupCoordinator };

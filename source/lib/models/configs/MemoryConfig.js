import { InvalidMemoryThresholds } from '../../exceptions/config/InvalidMemoryThresholds.js';
import { MemoryMaximumResolver } from '../../utils/memory/MemoryMaximumResolver.js';

const DEFAULT_THRESHOLDS = { low: 25.0, medium: 50.0, high: 75.0, over: 100.0 };
const THRESHOLD_KEYS = ['low', 'medium', 'high', 'over'];

/**
 * Represents the `web.memory` configuration: the resolved memory maximum and
 * the percentage thresholds used to derive a status from it.
 * @author darthjee
 */
class MemoryConfig {
  #thresholds;
  #dataStoreSize;

  /**
   * @param {object} [config={}] - Raw `web.memory` configuration object.
   * @param {number} [config.maximum] - Configured memory maximum, in bytes.
   * @param {object} [config.thresholds={}] - Percentage thresholds (`low`, `medium`, `high`, `over`).
   * @param {object} [config.data_store={}] - Configuration for the memory readings store (`{ size }`).
   * @param {object} [options={}] - Additional options.
   * @param {{resolve: Function}} [options.resolver] - Resolver used to compute the memory maximum,
   * defaulting to {@link MemoryMaximumResolver}.
   * @throws {InvalidMemoryThresholds} When thresholds are not in strictly ascending order.
   */
  constructor({ maximum, thresholds = {}, data_store: dataStore = {} } = {}, { resolver = MemoryMaximumResolver } = {}) {
    this.#thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
    this.#validateThresholds();

    this.maximum = resolver.resolve(maximum);
    this.#dataStoreSize = { size: 100, ...dataStore }.size;
  }

  /**
   * @returns {{low: number, medium: number, high: number, over: number}} The percentage thresholds.
   */
  get thresholds() {
    return this.#thresholds;
  }

  /**
   * @returns {number} The maximum number of memory readings to retain in the data store.
   */
  get dataStoreSize() {
    return this.#dataStoreSize;
  }

  /**
   * Derives a status label from a memory usage percentage, using inclusive
   * (`>=`) boundaries checked from the top down.
   * @param {number} percentage - The memory usage percentage.
   * @returns {'low'|'medium'|'high'|'over'} The derived status.
   */
  statusFor(percentage) {
    if (percentage >= this.#thresholds.over) return 'over';
    if (percentage >= this.#thresholds.high) return 'high';
    if (percentage >= this.#thresholds.medium) return 'medium';

    return 'low';
  }

  /**
   * Validates that thresholds are in strictly ascending order (`low < medium < high < over`).
   * @returns {void}
   * @throws {InvalidMemoryThresholds} When thresholds are not in strictly ascending order.
   * @private
   */
  #validateThresholds() {
    for (let i = 0; i < THRESHOLD_KEYS.length - 1; i++) {
      const lowerKey = THRESHOLD_KEYS[i];
      const higherKey = THRESHOLD_KEYS[i + 1];

      if (!(this.#thresholds[lowerKey] < this.#thresholds[higherKey])) {
        throw new InvalidMemoryThresholds(lowerKey, higherKey, this.#thresholds);
      }
    }
  }
}

export { MemoryConfig };

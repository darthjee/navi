import { InvalidMemoryDataStore } from '../../exceptions/config/InvalidMemoryDataStore.js';
import { InvalidMemoryThresholds } from '../../exceptions/config/InvalidMemoryThresholds.js';
import { MemoryMaximumResolver } from '../../utils/memory/MemoryMaximumResolver.js';

const DEFAULT_THRESHOLDS = { low: 25.0, medium: 50.0, high: 75.0, over: 100.0 };
const THRESHOLD_KEYS = ['low', 'medium', 'high', 'over'];
const DEFAULT_DATA_STORE = { size: 100, interval: 5, page_size: 20 };

/**
 * Represents the `web.memory` configuration: the resolved memory maximum and
 * the percentage thresholds used to derive a status from it.
 *
 * The `data_store` block configures the retained RSS-sampling buffer: `size`
 * readings are kept, sampled every `interval` seconds, so the retained
 * window is approximately `size * interval` (~8 minutes at the defaults of
 * `100` / `5`). `page_size` bounds how many entries a future
 * `/memory/history.json` endpoint returns per request.
 * @author darthjee
 */
class MemoryConfig {
  #thresholds;
  #dataStoreSize;
  #dataStoreInterval;
  #dataStorePageSize;

  /**
   * @param {object} [config={}] - Raw `web.memory` configuration object.
   * @param {number} [config.maximum] - Configured memory maximum, in bytes.
   * @param {object} [config.thresholds={}] - Percentage thresholds (`low`, `medium`, `high`, `over`).
   * @param {object} [config.data_store={}] - Configuration for the memory readings store
   * (`{ size=100, interval=5, page_size=20 }`). `size` is the maximum number of readings to
   * retain; `interval` is the number of seconds between RSS samples (must be a finite number
   * greater than 0); `page_size` is the maximum number of entries returned per request by the
   * future `/memory/history.json` endpoint.
   * @param {object} [options={}] - Additional options.
   * @param {{resolve: Function}} [options.resolver] - Resolver used to compute the memory maximum,
   * defaulting to {@link MemoryMaximumResolver}.
   * @throws {InvalidMemoryThresholds} When thresholds are not in strictly ascending order.
   * @throws {InvalidMemoryDataStore} When `data_store.interval` is not a finite number greater than 0.
   */
  constructor({ maximum, thresholds = {}, data_store: dataStore = {} } = {}, { resolver = MemoryMaximumResolver } = {}) {
    this.#thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
    this.#validateThresholds();

    this.maximum = resolver.resolve(maximum);

    const mergedDataStore = { ...DEFAULT_DATA_STORE, ...dataStore };

    this.#dataStoreSize = mergedDataStore.size;
    this.#dataStoreInterval = mergedDataStore.interval;
    this.#dataStorePageSize = mergedDataStore.page_size;
    this.#validateDataStoreInterval();
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
   * @returns {number} The number of seconds between RSS samples.
   */
  get dataStoreInterval() {
    return this.#dataStoreInterval;
  }

  /**
   * @returns {number} The maximum number of entries returned per request by the future
   * `/memory/history.json` endpoint.
   */
  get dataStorePageSize() {
    return this.#dataStorePageSize;
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

  /**
   * Validates that `data_store.interval` is a finite number greater than 0.
   * @returns {void}
   * @throws {InvalidMemoryDataStore} When the interval is not a finite number greater than 0.
   * @private
   */
  #validateDataStoreInterval() {
    if (!Number.isFinite(this.#dataStoreInterval) || this.#dataStoreInterval <= 0) {
      throw new InvalidMemoryDataStore(this.#dataStoreInterval);
    }
  }
}

export { MemoryConfig };

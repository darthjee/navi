import { AppError } from '../AppError.js';

/**
 * Thrown when a `web.memory.thresholds` config block does not declare
 * `low < medium < high < over` in strictly ascending order.
 * @author darthjee
 */
class InvalidMemoryThresholds extends AppError {
  /**
   * @param {string} lowerKey - The threshold key expected to be strictly lower.
   * @param {string} higherKey - The threshold key expected to be strictly higher.
   * @param {object} thresholds - The full resolved thresholds object.
   */
  constructor(lowerKey, higherKey, thresholds) {
    super(`Invalid memory thresholds: "${lowerKey}" (${thresholds[lowerKey]}) must be strictly less than "${higherKey}" (${thresholds[higherKey]})`);

    this.lowerKey = lowerKey;
    this.higherKey = higherKey;
    this.thresholds = thresholds;
  }
}

export { InvalidMemoryThresholds };

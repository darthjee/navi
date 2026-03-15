import { AppError } from './AppError.js';

/**
 * ItemNotFound is a custom error class thrown when a requested item
 * cannot be found.
 * @author darthjee
 */
class MissingTopLevelConfigKey extends AppError {
  constructor(key) {
    super(`Invalid config file: expected a top-level "${key}" key.`);
    this.key = key;
  }
}

export { MissingTopLevelConfigKey };

import { AppError } from './AppError.js';

/**
 * ItemNotFound is a custom error class thrown when a requested item
 * cannot be found.
 * @author darthjee
 */
class MissingClientsConfig extends AppError {
  constructor(itemType) {
    super(`Invalid config file: expected a top-level "${itemType}" key.`);
    this.itemType = itemType;
  }
}

export { MissingClientsConfig };

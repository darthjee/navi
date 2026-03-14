import { AppError } from './AppError.js';

/**
 * ItemNotFound is a custom error class thrown when a requested item
 * cannot be found.
 * @author darthjee
 */
class ItemNotFound extends AppError {
  constructor(itemName, { itemType = 'Item' } = {}) {
    super(`${itemType} "${itemName}" not found.`);
    this.itemName = itemName;
    this.itemType = itemType;
  }
}

export { ItemNotFound };

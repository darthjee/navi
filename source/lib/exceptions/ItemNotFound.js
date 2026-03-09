/**
 * ClientNotFound is a custom error class thrown when a requested client
 * cannot be found in config.
 * @author darthjee
 */
class ItemNotFound extends Error {
  constructor(itemName, { itemType = 'Item' } = {}) {
    super(`${itemType} "${itemName}" not found.`);
    this.name = 'ItemNotFound';
    this.itemName = itemName;
    this.itemType = itemType;
  }
}

export { ItemNotFound };

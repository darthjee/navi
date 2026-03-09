/**
 * ClientNotFound is a custom error class thrown when a requested client
 * cannot be found in config.
 * @author darthjee
 */
class ItemNotFound extends Error {
  constructor(itemName) {
    super(`Item "${itemName}" not found.`);
    this.name = 'ItemNotFound';
    this.itemName = itemName;
  }
}

export { ItemNotFound };

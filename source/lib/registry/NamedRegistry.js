import { ItemNotFound } from '../exceptions/ItemNotFound.js';

/**
 * NamedRegistry is a base class for registries that manage named items.
 * It provides a common interface for retrieving items by name and handling not-found cases.
 * Subclasses should define the specific type of items they manage and the appropriate not-found exception.
 * @author darthjee
 */
class NamedRegistry {
  #size;

  /*
   * The exception class to throw when an item is not found.
   * Subclasses should override this property to specify the appropriate exception type.
   * @see ItemNotFound
   * @see #notFound
   * @type {class}
   */
  static notFoundException = ItemNotFound;

  /**
   * @param {object} items An object mapping item names to their corresponding instances.
   */
  constructor(items) {
    this.items = items;
  }

  /**
   * Retrieves an item by name.
   * @param {string} name The name of the item to retrieve.
   * @returns {*} The item associated with the given name.
   * @throws {ItemNotFound} If the item with the specified name does not exist.
   */
  getItem(name) {
    if (name in this.items) {
      return this.items[name];
    }
    this.#notFound(name);
  }

  filter(predicate) {
    return Object.values(this.items).filter(predicate);
  }

  size() {
    if (this.#size === undefined) {
      this.#size = Object.keys(this.items).length;
    }
    return this.#size;
  }

  /**
   * Throws a not-found exception for the specified item name.
   * @param {string} name The name of the item that was not found.
   * @throws {ItemNotFound} Always throws an exception indicating the item was not found.
   * @see #notFoundException
   */
  #notFound(name) {
    const Ex = this.constructor.notFoundException;
    throw new Ex(name);
  }
}

export { NamedRegistry };

import { ItemNotFound } from '../exceptions/ItemNotFound.js';

class NamedRegistry {
  static notFoundException = ItemNotFound;

  constructor(items) {
    this.items = items;
  }

  getItem(name) {
    if (name in this.items) {
      return this.items[name];
    }
    this.#notFound(name);
  }

  #notFound(name) {
    const Ex = this.constructor.notFoundException;
    throw new Ex(name);
  }
}

export { NamedRegistry };
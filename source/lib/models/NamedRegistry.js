import { ItemNotFound } from '../errors/ItemNotFound.js';

class NamedRegistry {
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
    throw new ItemNotFound(name);
  }
}

export { NamedRegistry };
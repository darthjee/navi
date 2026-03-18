import { randomUUID } from 'crypto';

class IdentifyableCollection {
  #items;

  constructor(items = {}) {
    this.#items = items;
  }

  push(item) {
    this.#items[item.id] = item;
  }

  remove(id) {
    delete this.#items[id];
  }

  get(id) {
    return this.#items[id];
  }

  byIndex(id) {
    return this.list()[id];
  }

  list() {
    return Object.values(this.#items);
  }

  size() {
    return this.list().length;
  }

  hasAny() {
    return this.size() > 0;
  }

  generateUUID() {
    let id;

    do {
      id = randomUUID();
    } while (this.#items[id]);

    return id;
  }
}

export { IdentifyableCollection };

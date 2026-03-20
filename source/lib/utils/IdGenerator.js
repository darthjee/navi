import { UUidGenerator } from './UUidGenerator.js';

class IdGenerator {
  #uuidGenerator = null;

  constructor({ uuidGenerator = new UUidGenerator() } = {}) {
    this.#uuidGenerator = uuidGenerator;
  }

  generator() {
    const that = this;
    return function(attributes = {}) {
      return that.generate(attributes);
    };
  }

  generate(attributes = {}) {
    const id = this.#generateId(attributes.id);

    attributes = { id, ...attributes };

    return attributes;
  }

  #generateId(id) {
    if (id) {
      this.#uuidGenerator.push(id);
      return id;
    }

    return this.#uuidGenerator.generate();
  }
}

export { IdGenerator };
import { UUidGenerator } from './UUidGenerator.js';

class IdGenerator {
  #uuidGenerator = null;

  constructor({ uuidGenerator = new UUidGenerator() } = {}) {
    this.#uuidGenerator = uuidGenerator;
  }

  generator() {
    const that = this;
    return function(attributes = {}) {
      let id = attributes.id;

      if (id) {
        that.#uuidGenerator.push(id);
      } else {
        id = that.#uuidGenerator.generate();
      }

      attributes = {
        id,
        ...attributes
      };

      return attributes;
    };
  }
}

export { IdGenerator };
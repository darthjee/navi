import { UUidGenerator } from './UUidGenerator.js';

class IdGenerator {
  #uuidGenerator = null;

  constructor() {
    this.#uuidGenerator = new UUidGenerator();
  }

  generator() {
    const that = this;
    return function(attributes = {}) {
      attributes = {
        id: that.#uuidGenerator.generate(),
        ...attributes
      };

      return attributes;
    };
  }
}

export { IdGenerator };
import { UUidGenerator } from './UUidGenerator.js';

class IdGenerator {
  #uuidGenerator = null;

  constructor() {
    this.#uuidGenerator = new UUidGenerator();
  }

  generator() {
    const that = this;
    return function(attributes = {}) {
      return { id: that.#uuidGenerator.generate(), ...attributes };
    };
  }
}

export { IdGenerator };
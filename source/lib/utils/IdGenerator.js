import { UUidGenerator } from './UUidGenerator.js';

class IdGenerator {
  #uuidGenerator = null;

  constructor() {
    this.#uuidGenerator = new UUidGenerator();
  }

  generator() {
    const that = this;
    return function() {
      return { id: that.#uuidGenerator.generate() };
    };
  }
}

export { IdGenerator };
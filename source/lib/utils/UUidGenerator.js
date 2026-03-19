
import { randomUUID } from 'crypto';

class UUidGenerator {
  #generated = new Set();

  constructor({ generator = randomUUID } = {}) {
    this.generator = generator;
  }

  generate() {
    let id;

    do {
      id = this.generator();
    } while (this.#generated.has(id));

    this.#generated.add(id);
    return id;
  }
}

export { UUidGenerator };
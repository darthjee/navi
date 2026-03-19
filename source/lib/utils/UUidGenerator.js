
import { randomUUID } from 'crypto';
    
class UUidGenerator {
  #generated = new Set();

  generate() {
    let id;

    do {
      id = randomUUID();
    } while (this.#generated.has(id));

    this.#generated.add(id);
    return id;
  }
}

export { UUidGenerator };
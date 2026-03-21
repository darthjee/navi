
import { randomUUID } from 'crypto';

/**
 * UUidGenerator generates unique identifiers, ensuring no duplicates are produced
 * across multiple calls.
 *
 * It tracks previously generated or registered identifiers and retries generation
 * whenever a collision is detected.
 * @author darthjee
 */
class UUidGenerator {
  #generated = new Set();

  /**
   * Creates a new UUidGenerator instance.
   * @param {object} params - The parameters for creating a UUidGenerator instance.
   * @param {Function} params.generator - A function used to produce identifier values. Defaults to {@link randomUUID}.
   */
  constructor({ generator = randomUUID } = {}) {
    this.generator = generator;
  }

  /**
   * Registers an existing identifier to prevent it from being generated in the future.
   * @param {*} id - The identifier to register as already in use.
   * @returns {void}
   */
  push(id) {
    this.#generated.add(id);
  }

  /**
   * Generates a new unique identifier that has not been previously generated or registered.
   * @returns {*} A unique identifier.
   */
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
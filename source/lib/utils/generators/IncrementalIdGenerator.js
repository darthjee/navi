/**
 * IncrementalIdGenerator generates sequential integer identifiers starting from 1.
 * @author darthjee
 */
class IncrementalIdGenerator {
  #nextId;

  /**
   * Creates a new IncrementalIdGenerator instance.
   * @param {number} [start=1] - The first id to generate.
   */
  constructor(start = 1) {
    this.#nextId = start;
  }

  /**
   * Generates the next sequential integer identifier.
   * @returns {number} The next integer id.
   */
  generate() {
    return this.#nextId++;
  }
}

export { IncrementalIdGenerator };

import { UUidGenerator } from './UUidGenerator.js';

/**
 * IdGenerator generates unique identifiers for objects, ensuring no duplicates
 * are produced across multiple invocations.
 *
 * It delegates UUID generation to a {@link UUidGenerator} instance, and exposes
 * a generator function suitable for use as an attributes generator in a {@link Factory}.
 * @author darthjee
 */

/**
 * A function returned by {@link IdGenerator#generator} that enriches an attributes
 * object with a unique `id` field.
 * @callback IdGeneratorFunction
 * @param {object} [attributes={}] - The attributes object to enrich with a unique identifier.
 * @param {*} [attributes.id] - An optional existing identifier. If provided, it is kept and registered to avoid future collisions.
 * @returns {object} The attributes object with a guaranteed unique `id` field.
 * @example
 * const idGenerator = new IdGenerator();
 * const generate = idGenerator.generator();
 * generate({ name: 'foo' }); // => { id: '<uuid>', name: 'foo' }
 * generate({ id: 42, name: 'bar' }); // => { id: 42, name: 'bar' }
 */
class IdGenerator {
  #uuidGenerator = null;

  /**
   * Creates a new IdGenerator instance.
   * @param {object} params - The parameters for creating an IdGenerator instance.
   * @param {UUidGenerator} params.uuidGenerator - The UUID generator used to produce unique identifiers.
   */
  constructor({ uuidGenerator = new UUidGenerator() } = {}) {
    this.#uuidGenerator = uuidGenerator;
  }

  /**
   * Returns a function that generates attributes with a unique `id` field.
   *
   * The returned function accepts an optional attributes object and delegates
   * to {@link IdGenerator#generate}.
   * @returns {IdGeneratorFunction} A function that accepts an attributes object and returns it enriched with a unique `id`.
   */
  generator() {
    return (attributes = {}) => this.generate(attributes);
  }

  /**
   * Generates a unique `id` for the given attributes object and returns the enriched attributes.
   *
   * If the attributes already contain an `id`, that value is registered to avoid future collisions.
   * @param {object} attributes - The attributes object to enrich with a unique identifier.
   * @param {*} [attributes.id] - An optional existing identifier. If provided, it is kept and registered.
   * @returns {object} The attributes object with a guaranteed unique `id` field.
   */
  generate(attributes = {}) {
    const id = this.#generateId(attributes.id);

    attributes = { id, ...attributes };

    return attributes;
  }

  /**
   * Resolves the identifier to use, either by registering an existing one or generating a new unique one.
   * @param {*} id - The existing identifier, if any.
   * @returns {*} The resolved unique identifier.
   */
  #generateId(id) {
    if (id) {
      this.#uuidGenerator.push(id);
      return id;
    }

    return this.#uuidGenerator.generate();
  }
}

export { IdGenerator };
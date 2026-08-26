import { MemoryData } from './MemoryData.js';
import { IncrementalIdGenerator } from '../generators/IncrementalIdGenerator.js';

/**
 * MemoryDataFactory creates MemoryData instances with automatically assigned incremental IDs.
 * @author darthjee
 */
class MemoryDataFactory {
  #idGenerator;

  /**
   * Creates a new MemoryDataFactory instance.
   * @param {object} [params={}] - Construction parameters.
   * @param {IncrementalIdGenerator} [params.idGenerator] - The id generator to use.
   */
  constructor({ idGenerator = new IncrementalIdGenerator() } = {}) {
    this.#idGenerator = idGenerator;
  }

  /**
   * Builds a new MemoryData entry with an auto-assigned id.
   * @param {number} value - The raw RSS reading, in bytes.
   * @param {number} percentage - `value` as a percentage of the configured memory maximum.
   * @returns {MemoryData} The created memory entry.
   */
  build(value, percentage) {
    const id = this.#idGenerator.generate();
    return new MemoryData(id, value, percentage);
  }
}

export { MemoryDataFactory };

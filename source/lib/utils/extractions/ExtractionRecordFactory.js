import { ExtractionRecord } from './ExtractionRecord.js';
import { IncrementalIdGenerator } from '../generators/IncrementalIdGenerator.js';

/**
 * ExtractionRecordFactory creates ExtractionRecord instances with automatically assigned
 * incremental IDs.
 * @author darthjee
 */
class ExtractionRecordFactory {
  #idGenerator;

  /**
   * Creates a new ExtractionRecordFactory instance.
   * @param {object} [params={}] - Construction parameters.
   * @param {IncrementalIdGenerator} [params.idGenerator] - The id generator to use.
   */
  constructor({ idGenerator = new IncrementalIdGenerator() } = {}) {
    this.#idGenerator = idGenerator;
  }

  /**
   * Builds a new ExtractionRecord with an auto-assigned id.
   * @param {object} params - Extraction parameters.
   * @param {string} params.parserType - The parser type that produced the items.
   * @param {string|null} [params.originUrl] - The URL that triggered the extraction.
   * @param {number} [params.itemCount] - The number of items produced by the extraction.
   * @returns {ExtractionRecord} The created extraction record.
   */
  build({ parserType, originUrl, itemCount }) {
    const id = this.#idGenerator.generate();
    return new ExtractionRecord(id, { parserType, originUrl, itemCount });
  }
}

export { ExtractionRecordFactory };
